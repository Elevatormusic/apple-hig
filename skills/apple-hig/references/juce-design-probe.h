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

    // The descriptor JSON for `root` and all of its children. Call on the MESSAGE THREAD.
    inline juce::String describeComponentTree (juce::Component& root, const juce::String& snapshotName = "hig-probe.png")
    {
        juce::Array<juce::var> elements; int index = 0, axCovered = 0;
        collect (root, root, elements, index, axCovered);

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
        const auto json = describeComponentTree (root);
        root.setBounds (original);
        return json;
    }
}

#endif // JUCE_DEBUG
