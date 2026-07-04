/*
    apple-hig — JUCE design probe (header-only, drop-in).

    Walks a live JUCE Component tree and emits a `native-render` JSON descriptor (+ a snapshot PNG) that the
    apple-hig reviewer consumes (`/hig-review descriptor.json`) to produce real, measured `evidence: extracted`
    design findings — contrast, geometry/target-size, hierarchy — for native JUCE UIs.

    USAGE (in a PluginEditor, AFTER layout, on a DEBUG build):
        #include "juce-design-probe.h"
        // ...once the editor is shown (so accessibility + snapshot are valid):
        hig::writeDesignProbe (*getTopLevelComponent(),
                               juce::File ("hig-probe.json"),
                               juce::File ("hig-probe.png"));

    HARD CONSTRAINTS (validated against JUCE docs/source):
      * MESSAGE THREAD ONLY. The reads below carry no message-manager assertion, so an off-thread call is
        SILENT undefined behaviour. Call this synchronously from the message thread (editor ctor after layout,
        resized(), or a debug hotkey). Do not call repaint() from here.
      * JUCE 6.1+ for the accessibility enrichment (version-gated below); the geometry/colour/snapshot/JSON
        core compiles on JUCE 6.0 / 6 / 7 / 8.
      * Accessibility + snapshot are only valid once the editor is attached to a native peer (shown).
      * CUSTOM-PAINT LIMIT: colours drawn inside a custom paint() are unreachable; such nodes are emitted as
        `measurable:false` with fg/bg "not introspectable" and are never contrast-scored. Heavily custom UIs
        (typical pro-audio editors) will have a low coverage ratio — that is reported, not hidden.
*/

#pragma once

#if JUCE_DEBUG

#include <juce_gui_basics/juce_gui_basics.h>
#if defined (JUCE_MODULE_AVAILABLE_juce_opengl) && JUCE_MODULE_AVAILABLE_juce_opengl
 #include <juce_opengl/juce_opengl.h>   // only to detect OpenGL-attached (snapshot-blank) subtrees
#endif

namespace hig
{
    inline juce::String hexOf (juce::Colour c)             { return "#" + c.toDisplayString (false).toLowerCase(); }
    inline bool         isTransparent (juce::Colour c)      { return c.getAlpha() == 0; }

    inline juce::String typeOf (juce::Component& c)
    {
        if (dynamic_cast<juce::Label*>       (&c)) return "Label";
        if (dynamic_cast<juce::TextEditor*>  (&c)) return "TextEditor";
        if (dynamic_cast<juce::ComboBox*>    (&c)) return "ComboBox";
        if (dynamic_cast<juce::Slider*>      (&c)) return "Slider";
        if (dynamic_cast<juce::ToggleButton*>(&c)) return "ToggleButton";
        if (dynamic_cast<juce::TextButton*>  (&c)) return "TextButton";
        if (dynamic_cast<juce::Button*>      (&c)) return "Button";
        return "custom/unknown";   // de-facto practice: there is no class-name API on Component
    }

    inline juce::String labelOf (juce::Component& c)
    {
        if (auto* l  = dynamic_cast<juce::Label*>      (&c)) return l->getText();
        if (auto* b  = dynamic_cast<juce::Button*>     (&c)) return b->getButtonText();
        if (auto* cb = dynamic_cast<juce::ComboBox*>   (&c)) return cb->getText();
        if (auto* te = dynamic_cast<juce::TextEditor*> (&c)) return te->getText();
        return c.getTitle();   // developer-set fallback only, never the type key
    }

    // Font size as POINTS (getHeightInPoints) — never raw getHeight(), which overstates ~15-30%.
    inline double fontPtOf (juce::Component& c)
    {
        if (auto* l  = dynamic_cast<juce::Label*>      (&c)) return (double) l->getFont().getHeightInPoints();
        if (auto* te = dynamic_cast<juce::TextEditor*> (&c)) return (double) te->getFont().getHeightInPoints();
        return 0.0;
    }

    inline bool boldOf (juce::Component& c)
    {
        if (auto* l  = dynamic_cast<juce::Label*>      (&c)) return l->getFont().isBold();
        if (auto* te = dynamic_cast<juce::TextEditor*> (&c)) return te->getFont().isBold();
        return false;
    }

    // Probe-computed text overflow — a HEURISTIC, not a pixel-exact clip. A standard JUCE Label renders
    // SINGLE-LINE (squash-then-ellipsis), so the strongest signal is the unmodified string being wider than
    // the usable width on a one-line-tall label; a taller label is checked by laying the text out and
    // comparing height. Border insets are subtracted. False positives/negatives are possible — the reviewer
    // corroborates the `clip` finding against the snapshot.
    inline bool textOverflowsOf (juce::Component& c)
    {
        auto* l = dynamic_cast<juce::Label*> (&c);
        if (l == nullptr) return false;
        const auto text = l->getText();
        if (text.isEmpty()) return false;
        const auto  border  = l->getBorderSize();
        const float usableW = (float) c.getWidth()  - (float) (border.getLeft() + border.getRight());
        const float usableH = (float) c.getHeight() - (float) (border.getTop()  + border.getBottom());
        if (usableW <= 1.0f || usableH <= 1.0f) return false;
        const auto  font    = l->getFont();
        const float oneLine = font.getHeight();
        juce::AttributedString as; as.append (text, font);
        juce::TextLayout wide; wide.createLayout (as, 1.0e6f);   // no wrap -> natural single-line width (JUCE-8 safe)
        if (wide.getWidth() > usableW + 1.0f && usableH < oneLine * 1.8f) return true;                  // single-line clip
        juce::TextLayout layout; layout.createLayout (as, usableW);
        return usableH >= oneLine * 1.8f && layout.getHeight() > usableH + 1.0f;                         // multi-line clip
    }

    // Effective background: the widget's own bg colour id, else walk up to the nearest opaque ancestor.
    inline void resolveColours (juce::Component& c,
                                juce::String& fg, juce::String& bg, bool& fgOk, bool& bgOk)
    {
        fg = bg = "not introspectable"; fgOk = bgOk = false;
        // NOTE: findColour returns the REGISTERED colour, not the drawn pixel (LookAndFeel may blend/gradient),
        // so contrast from these is an approximation — the reviewer labels it as such.
        if (auto* l = dynamic_cast<juce::Label*> (&c))
        {
            fg = hexOf (l->findColour (juce::Label::textColourId));       fgOk = true;
            auto own = l->findColour (juce::Label::backgroundColourId);
            if (! isTransparent (own)) { bg = hexOf (own); bgOk = true; }
        }
        else if (auto* tb = dynamic_cast<juce::TextButton*> (&c))
        {
            const bool on = tb->getToggleState();
            fg = hexOf (tb->findColour (on ? juce::TextButton::textColourOnId : juce::TextButton::textColourOffId)); fgOk = true;
            bg = hexOf (tb->findColour (on ? juce::TextButton::buttonOnColourId : juce::TextButton::buttonColourId)); bgOk = true;
        }
        else if (auto* te = dynamic_cast<juce::TextEditor*> (&c))
        {
            fg = hexOf (te->findColour (juce::TextEditor::textColourId)); fgOk = true;
            auto own = te->findColour (juce::TextEditor::backgroundColourId);
            if (! isTransparent (own)) { bg = hexOf (own); bgOk = true; }
        }
        // transparent / unset background: walk up to the nearest opaque ancestor's fill
        if (fgOk && ! bgOk)
            for (auto* p = c.getParentComponent(); p != nullptr; p = p->getParentComponent())
            {
                auto pc = p->findColour (juce::ResizableWindow::backgroundColourId);
                if (! isTransparent (pc)) { bg = hexOf (pc); bgOk = true; break; }
            }
    }

    inline juce::var elementVar (juce::Component& root, juce::Component& c, int index, int& axCovered)
    {
        auto* o = new juce::DynamicObject();
        const auto type = typeOf (c);

        o->setProperty ("id",   c.getComponentID().isNotEmpty() ? c.getComponentID() : ("c" + juce::String (index)));
        o->setProperty ("type", type);

        // geometry in the probed-root LOGICAL coordinate space (transform/scale aware). The root itself is
        // (0,0,w,h) in its own space — using getLocalArea against its desktop parent would offset it by the
        // window/title-bar, so it wouldn't "contain" its children and every child would read as an overlap.
        const auto r = (&c == &root) ? root.getLocalBounds()
                                     : root.getLocalArea (c.getParentComponent(), c.getBounds());
        auto* b = new juce::DynamicObject();
        b->setProperty ("x", r.getX()); b->setProperty ("y", r.getY());
        b->setProperty ("w", r.getWidth()); b->setProperty ("h", r.getHeight());
        o->setProperty ("bounds", juce::var (b));

        const bool isCustom = (type == "custom/unknown");
        juce::String fg, bg; bool fgOk = false, bgOk = false;
        if (! isCustom) resolveColours (c, fg, bg, fgOk, bgOk);
        else { fg = bg = "not introspectable"; }

        o->setProperty ("label", labelOf (c));
        o->setProperty ("value", juce::String());
        o->setProperty ("fg", fg);  o->setProperty ("bg", bg);
        o->setProperty ("fgIntrospectable", fgOk);  o->setProperty ("bgIntrospectable", bgOk);
        o->setProperty ("fontPt", fontPtOf (c));    o->setProperty ("bold", boldOf (c));
        o->setProperty ("visible", c.isVisible());  o->setProperty ("showing", c.isShowing());
        o->setProperty ("enabled", c.isEnabled());

        bool checkable = false, checked = false;
        juce::String role;
        if (auto* btn = dynamic_cast<juce::Button*> (&c)) { checkable = btn->getClickingTogglesState(); checked = btn->getToggleState(); }

       #if (JUCE_MAJOR_VERSION > 6) || (JUCE_MAJOR_VERSION == 6 && JUCE_MINOR_VERSION >= 1)
        // Accessibility enrichment — opportunistic. getAccessibilityHandler() returns nullptr unless the
        // component is accessible AND attached to a native peer; the first call per node also allocates and
        // fires a native 'elementCreated' event, so call once and tolerate null.
        if (auto* h = c.getAccessibilityHandler())
        {
            ++axCovered;
            const auto st = h->getCurrentState();
            checkable = checkable || st.isCheckable();
            checked   = checked   || st.isChecked();
            if (auto* vi = h->getValueInterface()) o->setProperty ("value", vi->getCurrentValueAsString());
        }
       #endif

        o->setProperty ("role", role);
        o->setProperty ("checkable", checkable);  o->setProperty ("checked", checked);
        o->setProperty ("measurable", ! isCustom);
        // GPU/Web subtrees render blank in createComponentSnapshot — flag, don't pixel-score. OpenGL is
        // detected by an attached OpenGLContext on the component or an ancestor (NOT OpenGLAppComponent,
        // which is a standalone-app base class never used inside a plugin editor).
        bool gpu = false;
       #if JUCE_WEB_BROWSER   // juce::WebBrowserComponent only exists when this is 1; many apps build with 0
        gpu = (dynamic_cast<juce::WebBrowserComponent*> (&c) != nullptr);
       #endif
       #if defined (JUCE_MODULE_AVAILABLE_juce_opengl) && JUCE_MODULE_AVAILABLE_juce_opengl
        for (auto* p = &c; p != nullptr && ! gpu; p = p->getParentComponent())
            if (juce::OpenGLContext::getContextAttachedTo (*p) != nullptr) gpu = true;
       #endif
        o->setProperty ("snapshotMayBeBlank", gpu);
        o->setProperty ("textOverflows", textOverflowsOf (c));
        return juce::var (o);
    }

    inline void collect (juce::Component& root, juce::Component& c, juce::Array<juce::var>& out, int& index, int& axCovered)
    {
        if (c.isVisible() || &c == &root)
            out.add (elementVar (root, c, index++, axCovered));
        for (int i = 0; i < c.getNumChildComponents(); ++i)
            if (auto* child = c.getChildComponent (i))
                collect (root, *child, out, index, axCovered);
    }

    // =====================================================================================================
    // STATE SWEEP — force each control through its programmatically-driveable visual states, snapshot the
    // probed ROOT per state, and sample the control's rectangle. Emits per-element `states` and a top-level
    // `sweep` block the reviewer's stateFindings() consumes. MESSAGE THREAD ONLY, ONE synchronous block:
    // createComponentSnapshot paints synchronously via paintEntireComponent (verified: juce_Component.cpp —
    // createComponentSnapshot ends 'paintEntireComponent (g, true)'), so no message-loop wait is needed and
    // real mouse events (which arrive via the loop) cannot interleave to clear a forced state.
    // Every JUCE fact below is from the adversarially-verified research (2026-07-02-state-checker-research.json,
    // juce-apis job); citations reference that verification.
    // =====================================================================================================

    // Build an [r,g,b] triplet var (three ints, 0-255) from double accumulators over `count` opaque pixels.
    // count==0 → [0,0,0] (every pixel transparent → colour meaningless). Round-to-nearest; the inputs are
    // channel sums (0-255 each) so the mean is always in range.
    inline juce::var sweepRgbVar (double sumR, double sumG, double sumB, long count)
    {
        juce::Array<juce::var> rgb;
        if (count > 0)
        {
            rgb.add ((int) (sumR / (double) count + 0.5));
            rgb.add ((int) (sumG / (double) count + 0.5));
            rgb.add ((int) (sumB / (double) count + 0.5));
        }
        else { rgb.add (0); rgb.add (0); rgb.add (0); }
        return juce::var (rgb);
    }

    // Sample the control's root-relative rect (INSET by 20% per edge, min 2px) out of one root snapshot for
    // one already-applied state. Snapshots the ROOT, never the control: createComponentSnapshot uses
    // ignoreAlphaLevel=true, so a control snapshotted directly hides its own setAlpha() disabled-dimming
    // (verified: juce_Component.cpp — createComponentSnapshot passes paintEntireComponent(g, true)). One
    // readOnly BitmapData per snapshot; getPixelColour does NO bounds check so coordinates are clamped here
    // (verified: juce_Image.h — BitmapData::getPixelColour 'no bounds checking, caller's responsibility';
    // returned colours are unpremultiplied/straight). Emits { rgb:[3], alpha:0..1, grid?:16 } — alpha ALWAYS
    // present; rgb is the mean over alpha>0 pixels (or [0,0,0] when every inset pixel is transparent).
    inline juce::var sweepSampleControl (juce::Component& root, juce::Rectangle<int> rootRect)
    {
        auto* o = new juce::DynamicObject();
        auto emitTransparent = [&o]() -> juce::var
        {
            // Nothing paintable / degenerate rect — emit a not-measurable (alpha 0) state, never omit it.
            o->setProperty ("rgb", sweepRgbVar (0.0, 0.0, 0.0, 0));
            o->setProperty ("alpha", 0.0);
            return juce::var (o);
        };

        // Snapshot the whole root at 1.0 (portable 3-param form — the 4-param ImageType overload is JUCE-8
        // only; verified: 6.1.6/7.0.12 declare the 3-param signature).
        const auto img = root.createComponentSnapshot (root.getLocalBounds(), true, 1.0f);
        const int iw = img.getWidth(), ih = img.getHeight();
        if (! img.isValid() || iw <= 0 || ih <= 0)
            return emitTransparent();

        // Inset by 20% of each dimension, min 2px, per edge — anti-aliased/rounded edges drift past the
        // consumer's Δ8 recipe slack, so we sample the interior only.
        const int insetX = juce::jmax (2, rootRect.getWidth()  / 5);
        const int insetY = juce::jmax (2, rootRect.getHeight() / 5);
        auto inset = rootRect.reduced (insetX, insetY);

        // Clamp the inset rect into the image bounds ourselves (getPixelColour is unchecked). Intersecting
        // with the image rectangle yields an in-bounds rect; an empty/degenerate result → transparent state.
        inset = inset.getIntersection (juce::Rectangle<int> (0, 0, iw, ih));
        if (inset.getWidth() <= 0 || inset.getHeight() <= 0)
            return emitTransparent();

        const int x0 = inset.getX(), y0 = inset.getY(), w = inset.getWidth(), h = inset.getHeight();

        // ONE readOnly BitmapData for all reads (getPixelAt would build a 1x1 BitmapData per pixel; on a
        // JUCE-8 native image that is one GPU readback per pixel — verified: J2-native-image-cost).
        const juce::Image::BitmapData bmp (img, juce::Image::BitmapData::readOnly);

        double sumR = 0.0, sumG = 0.0, sumB = 0.0, sumA = 0.0;
        long   opaqueCount = 0;                       // pixels with alpha > 0 (colour is meaningful)
        const long totalCount = (long) w * (long) h;  // ALL inset pixels (mean alpha denominator)

        for (int y = 0; y < h; ++y)
            for (int x = 0; x < w; ++x)
            {
                const auto c = bmp.getPixelColour (x0 + x, y0 + y); // clamped above → always in bounds
                sumA += (double) c.getAlpha();
                if (c.getAlpha() > 0)
                {
                    sumR += (double) c.getRed();
                    sumG += (double) c.getGreen();
                    sumB += (double) c.getBlue();
                    ++opaqueCount;
                }
            }

        o->setProperty ("rgb", sweepRgbVar (sumR, sumG, sumB, opaqueCount));
        // Mean alpha over ALL inset pixels, normalized to 0..1 (channels are 0-255). ALWAYS emitted — the
        // consumer treats low-alpha samples as not-measurable rather than as colours.
        o->setProperty ("alpha", totalCount > 0 ? (sumA / (double) totalCount) / 255.0 : 0.0);

        // A 4x4 grid of per-cell mean rgb over the inset rect (exactly 16 entries). Omitted entirely if the
        // inset rect is degenerate (<4x4 px) — the consumer's samplesEqual() tolerates a missing grid.
        if (w >= 4 && h >= 4)
        {
            juce::Array<juce::var> grid;
            for (int gy = 0; gy < 4; ++gy)
                for (int gx = 0; gx < 4; ++gx)
                {
                    // Cell bounds inside the inset rect (last row/col absorbs the integer remainder).
                    const int cx0 = (gx * w) / 4;
                    const int cx1 = (gx == 3) ? w : ((gx + 1) * w) / 4;
                    const int cy0 = (gy * h) / 4;
                    const int cy1 = (gy == 3) ? h : ((gy + 1) * h) / 4;

                    double cr = 0.0, cg = 0.0, cb = 0.0;
                    long   cn = 0;
                    for (int y = cy0; y < cy1; ++y)
                        for (int x = cx0; x < cx1; ++x)
                        {
                            const auto c = bmp.getPixelColour (x0 + x, y0 + y);
                            if (c.getAlpha() > 0)
                            {
                                cr += (double) c.getRed();
                                cg += (double) c.getGreen();
                                cb += (double) c.getBlue();
                                ++cn;
                            }
                        }
                    grid.add (sweepRgbVar (cr, cg, cb, cn));
                }
            o->setProperty ("grid", juce::var (grid));
        }

        return juce::var (o);
    }

    // Sweep ONE control through its states and attach a `states` object to its element `var`. Returns true if
    // the control was swept (so the caller can count sweptControls). `c` is the control; `elementObj` is its
    // already-built element (from collect, matched by traversal index). Only call for currently-enabled,
    // uncached controls (the caller gates that). Ordering is load-bearing and verified.
    inline bool sweepOneControl (juce::Component& root, juce::Component& c, juce::DynamicObject* elementObj)
    {
        if (elementObj == nullptr) return false;

        // Root-space rect — same ternary as elementVar: the root in its OWN space is (0,0,w,h); getLocalArea
        // against its desktop parent would offset it by the window/title-bar and sample the wrong pixels
        // when a single control IS the probed root.
        const auto rootRect = (&c == &root) ? root.getLocalBounds()
                                            : root.getLocalArea (c.getParentComponent(), c.getBounds());

        // A control scrolled out of the root's viewport (e.g. inside a juce::Viewport) samples pure
        // transparency in every state — alpha-0 data that can only mislead. Skip the sweep entirely and do
        // NOT count it in sweptControls.
        if (! rootRect.intersects (root.getLocalBounds()))
            return false;

        auto* states = new juce::DynamicObject();

        auto* btn = dynamic_cast<juce::Button*> (&c);

        // ---- SAVE (verified restore protocol J8) --------------------------------------------------------
        // Per Button: {getState(), getToggleState(), isEnabled()} + the toggle states of every same-
        // radioGroupId sibling (setToggleState(true,...) silently un-toggles the group via
        // turnOffOtherButtonsInGroup — verified: juce_Button.cpp). Non-Button: enabled only.
        const bool savedEnabled = c.isEnabled();
        juce::Button::ButtonState savedButtonState = juce::Button::buttonNormal;
        bool savedToggle = false;
        const bool canToggle = (btn != nullptr)
                               && (btn->getClickingTogglesState() || dynamic_cast<juce::ToggleButton*> (&c) != nullptr);
        const int radioGroup = (btn != nullptr) ? btn->getRadioGroupId() : 0;

        // Same-radioGroupId siblings whose toggle state we must save/restore (only when we will toggle).
        juce::Array<juce::Button*> groupSiblings;
        juce::Array<bool>          groupSavedToggles;
        if (btn != nullptr)
        {
            savedButtonState = btn->getState();
            savedToggle = btn->getToggleState();
            if (canToggle && radioGroup != 0)
                if (auto* parent = c.getParentComponent())
                    for (int i = 0; i < parent->getNumChildComponents(); ++i)
                        if (auto* sib = dynamic_cast<juce::Button*> (parent->getChildComponent (i)))
                            if (sib != btn && sib->getRadioGroupId() == radioGroup)
                            {
                                groupSiblings.add (sib);
                                groupSavedToggles.add (sib->getToggleState());
                            }
        }

        // ---- SWEEP ------------------------------------------------------------------------------------
        // Per state, apply setEnabled/setToggleState FIRST and Button::setState LAST, then snapshot
        // IMMEDIATELY: enablementChanged()->updateState() clears a forced state and forces buttonNormal
        // while disabled (verified: juce_Button.cpp — enablementChanged/updateState). All silent-notification.

        // normal: enabled, current toggle, forced buttonNormal (Button) — ALWAYS present.
        c.setEnabled (true);
        if (btn != nullptr) btn->setState (juce::Button::buttonNormal);
        states->setProperty ("normal", sweepSampleControl (root, rootRect));

        if (btn != nullptr)
        {
            // over / down — setState is public, visual-only, never clicks (verified: juce_Button.cpp —
            // setState only repaint()+sendStateMessage; never sendClickMessage). Fires state listeners
            // (unsuppressable) — declared as a side effect.
            btn->setState (juce::Button::buttonOver);
            states->setProperty ("over", sweepSampleControl (root, rootRect));

            btn->setState (juce::Button::buttonDown);
            states->setProperty ("down", sweepSampleControl (root, rootRect));

            // toggledOn / toggledOff — only for toggle-capable buttons. setToggleState(x, dontSendNotification)
            // is silent except radio-group cross-talk (handled by save/restore) + async Value callbacks
            // (declared). Apply toggle FIRST, force buttonNormal LAST so the toggle visual isn't masked by a
            // forced over/down.
            if (canToggle)
            {
                btn->setToggleState (true, juce::dontSendNotification);
                btn->setState (juce::Button::buttonNormal);
                states->setProperty ("toggledOn", sweepSampleControl (root, rootRect));

                btn->setToggleState (false, juce::dontSendNotification);
                btn->setState (juce::Button::buttonNormal);
                states->setProperty ("toggledOff", sweepSampleControl (root, rootRect));

                // Per-state ISOLATION: return the toggle to its SAVED value before the disabled sample below —
                // otherwise a control saved ON is sampled disabled-at-off and tiers 2/3 compare on-idle vs
                // off-disabled (every checked checkbox / selected radio). Change-gated no-op when saved off
                // (verified: 6.1.6 juce_Button.cpp:165 — setToggleState early-outs when unchanged);
                // group-safe: same-radioGroupId siblings are saved/restored regardless.
                btn->setToggleState (savedToggle, juce::dontSendNotification);
            }
        }

        // disabled — every component. setEnabled(false) FIRST (Button::setState below would be cleared by
        // enablementChanged->updateState anyway; while disabled updateState forces buttonNormal), snapshot
        // immediately. Only reached for controls the caller proved isEnabled()==true, so restore is exactly
        // setEnabled(true) (verified: J8 — no public own-flag getter; isEnabled() ANDs ancestors).
        c.setEnabled (false);
        states->setProperty ("disabled", sweepSampleControl (root, rootRect));

        // ---- RESTORE (reverse of SAVE) ---------------------------------------------------------------
        // setEnabled FIRST (enablementChanged->updateState resets buttonState), then all toggle states
        // (dontSendNotification), then setState(saved).
        c.setEnabled (savedEnabled);
        if (btn != nullptr)
        {
            if (canToggle)
            {
                btn->setToggleState (savedToggle, juce::dontSendNotification);
                for (int i = 0; i < groupSiblings.size(); ++i)
                    groupSiblings.getReference (i)->setToggleState (groupSavedToggles.getReference (i), juce::dontSendNotification);
            }
            btn->setState (savedButtonState);
        }

        elementObj->setProperty ("states", juce::var (states));
        return true;
    }

    // Walk the tree in the SAME order as collect() (visible-or-root, then children in child order),
    // correlating each swept control to its element entry by traversal index. Skips: non-controls; controls
    // reporting isEnabled()==false (a disabled ancestor makes restore non-exact — J8 gate); and components
    // with a cached component image (setBufferedToImage stale-cache risk — medium-confidence research risk).
    // Accumulates the swept count only (blindSpots/sideEffects are the fixed declarations emitted by
    // describeComponentTree's sweep block).
    inline void sweepStates (juce::Component& root, juce::Component& c, juce::Array<juce::var>& elements,
                             int& index, int& sweptControls)
    {
        if (c.isVisible() || &c == &root)
        {
            const int myIndex = index++;
            // Only sweep real controls; and only when currently enabled (isEnabled() ANDs ancestors, so this
            // both proves the own-flag is true AND skips controls inside a disabled ancestor — verified J8);
            // and never a component that serves a buffered image cache (stale-pixel risk — verified risk,
            // medium confidence: a custom node that changes state without repaint() would serve stale pixels).
            const bool isControl = dynamic_cast<juce::Button*>     (&c) != nullptr
                                || dynamic_cast<juce::Slider*>     (&c) != nullptr
                                || dynamic_cast<juce::ComboBox*>   (&c) != nullptr
                                || dynamic_cast<juce::TextEditor*> (&c) != nullptr
                                || dynamic_cast<juce::Label*>      (&c) != nullptr;
            const bool cached  = (c.getCachedComponentImage() != nullptr);

            if (isControl && c.isEnabled() && ! cached && myIndex >= 0 && myIndex < elements.size())
            {
                // The element at myIndex is c's own DynamicObject (collect built it at the same index).
                if (auto* obj = elements.getReference (myIndex).getDynamicObject())
                    if (sweepOneControl (root, c, obj))
                        ++sweptControls;
            }
        }
        for (int i = 0; i < c.getNumChildComponents(); ++i)
            if (auto* child = c.getChildComponent (i))
                sweepStates (root, *child, elements, index, sweptControls);
    }

    // The descriptor JSON for `root` and all of its children. Call on the MESSAGE THREAD.
    // `sweep` (default true) runs the state sweep and attaches per-element `states` + a top-level `sweep`
    // block. describeAtSize passes false — it is a layout probe and must not force control states.
    inline juce::String describeComponentTree (juce::Component& root, const juce::String& snapshotName = "hig-probe.png",
                                               bool sweep = true)
    {
        juce::Array<juce::var> elements; int index = 0, axCovered = 0;
        collect (root, root, elements, index, axCovered);

        int sweptControls = 0;
        if (sweep)
        {
            // J8 focus protocol: setEnabled(false) on a focused child moves focus to the parent / gives it
            // away and does NOT return it on re-enable (verified: juce_Component.cpp setEnabled focus branch,
            // lines 3147-3154). Save the focused component before the sweep and re-grab after all restores —
            // BEST-EFFORT: grabKeyboardFocus may legitimately fail when the window peer lacks OS focus
            // (verified J4: takeKeyboardFocus bails on '! peer->isFocused()'), and headless probes usually
            // have nothing focused at all. WeakReference, NOT a raw pointer: the sweep's forced transitions
            // fire SYNCHRONOUS state/enablement listeners, and app code in those listeners may delete
            // components mid-sweep — deletion does not require the message loop. This is JUCE's own
            // FocusRestorer pattern (verified: 6.1.6 juce_Component.cpp:180-195 — WeakReference + isShowing +
            // modal guard before grabKeyboardFocus); Button.cpp guards this same synchronous-listener
            // re-entrancy class with its deletionWatcher WeakReferences (6.1.6 Button.cpp:167/250).
            juce::WeakReference<juce::Component> focused (juce::Component::getCurrentlyFocusedComponent());

            int sweepIndex = 0;                                  // re-walk with a fresh index (mirrors collect)
            sweepStates (root, root, elements, sweepIndex, sweptControls);

            if (focused != nullptr && focused->isShowing()
                 && ! focused->isCurrentlyBlockedByAnotherModalComponent())
                focused->grabKeyboardFocus();
        }

        auto* meta = new juce::DynamicObject();
        meta->setProperty ("juceVersion", juce::SystemStats::getJUCEVersion());
        meta->setProperty ("scaleFactor", 1.0);
        auto* rb = new juce::DynamicObject();
        rb->setProperty ("x", 0); rb->setProperty ("y", 0);
        rb->setProperty ("w", root.getWidth()); rb->setProperty ("h", root.getHeight());
        meta->setProperty ("rootBounds", juce::var (rb));
        meta->setProperty ("snapshotPath", snapshotName);
        meta->setProperty ("shown", root.isShowing());
        meta->setProperty ("axCoverageRatio", elements.size() > 0 ? (double) axCovered / (double) elements.size() : 0.0);

        auto* top = new juce::DynamicObject();
        top->setProperty ("meta", juce::var (meta));
        top->setProperty ("elements", elements);

        // Top-level sweep block (only when the sweep ran) — the reviewer surfaces these verbatim. blindSpots
        // are the proven-unforceable states (verified: J4 focus / J5 window-inactive / J7 non-Button hover +
        // Slider/ComboBox drag); sideEffects are the unsuppressable behavioural leaks (verified J1/J3/J8).
        if (sweep)
        {
            auto* sw = new juce::DynamicObject();
            sw->setProperty ("sweptControls", sweptControls);

            juce::Array<juce::var> blind;
            blind.add (juce::String ("window-inactive styling"));            // J5: no public forcing API
            blind.add (juce::String ("focus visuals (window unfocused)"));    // J4: takeKeyboardFocus bails
            blind.add (juce::String ("hover (non-Button controls)"));         // J7: no public setter
            blind.add (juce::String ("pressed/drag visuals (Slider/ComboBox)")); // J7: protected/no API
            sw->setProperty ("blindSpots", juce::var (blind));

            juce::Array<juce::var> side;
            side.add (juce::String ("state listeners fired on forced transitions"));   // J1: sendStateMessage
            side.add (juce::String ("async Value callbacks possible"));                // J3: async, unsuppressable
            side.add (juce::String ("focus may move if a swept child held it"));        // J8: setEnabled(false)
            sw->setProperty ("sideEffects", juce::var (side));

            top->setProperty ("sweep", juce::var (sw));
        }
        return juce::JSON::toString (juce::var (top));
    }

    // One top-level snapshot (renders all children) at scaleFactor 1.0 → 1:1 pixel-to-geometry.
    inline void writeSnapshot (juce::Component& root, const juce::File& pngOut)
    {
        const auto img = root.createComponentSnapshot (root.getLocalBounds(), true, 1.0f);
        if (! img.isValid()) return; // empty for zero-size / not-yet-laid-out components
        juce::PNGImageFormat png;
        juce::FileOutputStream os (pngOut);
        if (os.openedOk()) png.writeImageToStream (img, os);
    }

    inline void writeDesignProbe (juce::Component& root, const juce::File& jsonOut, const juce::File& pngOut)
    {
        jsonOut.replaceWithText (describeComponentTree (root, pngOut.getFileName()));
        writeSnapshot (root, pngOut);
    }

    // Reflow stress: re-walk at a DIFFERENT size, then restore (setSize is a no-op if the size is unchanged).
    inline juce::String describeAtSize (juce::Component& root, int w, int h)
    {
        const auto original = root.getBounds();
        root.setSize (w, h);                 // triggers a synchronous resized()
        const auto json = describeComponentTree (root, "hig-probe.png", /*sweep*/ false); // layout probe: no state forcing
        root.setBounds (original);
        return json;
    }
}

#endif // JUCE_DEBUG
