"use client";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { contentExtensions, inlineExtensions } from "./extensions";
import {
  documentHeadings,
  type ContentDocument,
  contentUrl,
} from "@/lib/editor/document";
import { EditorContext } from "./editor-context";
import { EditorIcon } from "./editor-icon";
import { SelectionMenu } from "./selection-menu";
import { blockLabels, blockDescriptions } from "@/lib/editor/block-labels";
import "./editor.css";
export function ContentEditor({
  value,
  onChange,
  locale,
  compact = false,
  editable = true,
  upload,
  label,
  sectionGoals = false,
  goalOptions = [],
  blockSet = "default",
}: {
  sectionGoals?: boolean;
  goalOptions?: {id:number;name:string}[];
  blockSet?: "default" | "quality";
  value: ContentDocument;
  onChange: (doc: ContentDocument) => void;
  locale: "en" | "ar" | "fr";
  compact?: boolean;
  label?: string;
  editable?: boolean;
  upload: (file: File) => Promise<string>;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      const toolbar = toolbarRef.current;
      if (!toolbar) return;
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof PointerEvent &&
        toolbar.contains(event.target as globalThis.Node)
      )
        return;
      toolbar
        .querySelectorAll("details[open]")
        .forEach((item) => item.removeAttribute("open"));
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  const [link, setLink] = useState(""),
    [notice, setNotice] = useState("");
  const editor = useEditor({
    extensions: compact ? inlineExtensions : contentExtensions,
    content: value,
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "brand-prose",
        dir: locale === "ar" ? "rtl" : "ltr",
        role: "textbox",
        "aria-label":
          label ?? (compact ? "Title editor" : "Article body editor"),
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as ContentDocument),
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value))
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  useEffect(() => {
    editor?.setEditable(editable, false);
  }, [editor, editable]);
  if (!editor) return <div className="editor-loading">Loading editor…</div>;
  const add = (type: string) => {
    const p = { type: "paragraph" },
      h = { type: "heading", attrs: { level: 2, id: crypto.randomUUID() } };
    const blocks: Record<string, object> = {
      contentSection: {
        type,
        attrs: { id: crypto.randomUUID(), goals: [], visible: true },
        content: [h, p],
      },
      sectionHeader: {
        type,
        attrs: {
          eyebrow: "",
          width: "measure",
          layout: "stacked",
          singleLine: false,
          ctaLabel: "",
          ctaHref: "",
          visible: true,
        },
        content: [h, p],
      },
      actions: {
        type,
        attrs: {
          items: [{ label: "", href: "", variant: "primary", visible: true }],
          visible: true,
        },
      },
      aboutProfile: {
        type,
        attrs: {
          image: "",
          alt: "",
          storyLabel: "Our story",
          story: "",
          visionLabel: "Our vision",
          vision: "",
          missionLabel: "Our mission",
          mission: "",
          visible: true,
        },
      },
      valuesRail: { type, attrs: { items: [], visible: true } },
      mediaCards: { type, attrs: { items: [], visible: true } },
      pillars: { type, attrs: { items: [], visible: true } },
      certificationPanel: { type, attrs: { holder: "group", visible: true } },
      dataTable: {
        type,
        attrs: {
          caption: "",
          headers: ["", ""],
          rows: [["", ""]],
          visible: true,
        },
      },
      image: {
        type,
        attrs: { src: "", captionPosition: "below", visible: true },
      },
      gallery: {
        type,
        attrs: { images: [], captionPosition: "below", visible: true },
      },
      facts: { type, attrs: { items: [], label: "", visible: true } },
      textStatistics: {
        type,
        attrs: { label: "", markSrc: "", markAlt: "", markHref: "", items: [], visible: true },
        content: [h, p],
      },
      columns: {
        type,
        attrs: {
          layout: "equal",
          verticalAlign: "start",
          mediaSide: "start",
          visible: true,
        },
        content: [
          { type: "column", content: [p] },
          { type: "column", content: [p] },
        ],
      },
      threeColumns: {
        type: "columns",
        attrs: {
          layout: "equal",
          verticalAlign: "start",
          mediaSide: "start",
          visible: true,
        },
        content: [0, 1, 2].map(() => ({ type: "column", content: [p] })),
      },
      video: { type, attrs: { visible: true, captionPosition: "below", captionStyle: "plain" } },
      callout: { type, attrs: { visible: true }, content: [p] },
    };
    editor.chain().focus().insertContent(blocks[type]).run();
  };
  const headings = documentHeadings(editor.getJSON() as ContentDocument);
  const selectedBlock = [
    "heading",
    "paragraph",
    "blockquote",
    "bulletList",
    "orderedList",
    "horizontalRule",
  ].find((type) => editor.isActive(type));
  return (
    <EditorContext.Provider value={{ upload, sectionGoals, goalOptions }}>
      <div
        className={`content-editor${compact ? " content-editor--compact" : ""}`}
        lang={locale}
      >
        <div
          ref={toolbarRef}
          className="editor-toolbar"
          aria-label="Text formatting"
        >
          {!compact && (
            <select
              aria-label="Text style"
              value={
                editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : editor.isActive("paragraph", { variant: "lead" })
                      ? "lead"
                      : "p"
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "h2" || v === "h3")
                  editor
                    .chain()
                    .focus()
                    .setHeading({ level: v === "h2" ? 2 : 3 })
                    .updateAttributes("heading", {
                      id:
                        editor.getAttributes("heading").id ||
                        crypto.randomUUID(),
                    })
                    .run();
                else
                  editor
                    .chain()
                    .focus()
                    .setParagraph()
                    .updateAttributes("paragraph", {
                      variant: v === "lead" ? "lead" : "body",
                    })
                    .run();
              }}
            >
              <option value="p">Body</option>
              <option value="lead">Lead paragraph</option>
              <option value="h2">Section heading</option>
              <option value="h3">Subheading</option>
            </select>
          )}
          <button
            type="button"
            aria-pressed={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <EditorIcon name="bold" />
            <span className="editor-sr">Bold</span>
          </button>
          <button
            type="button"
            aria-pressed={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <EditorIcon name="italic" />
            <span className="editor-sr">
              {compact ? "Accent emphasis" : "Italic / heading accent"}
            </span>
          </button>
          {!compact && (
            <>
              <button
                type="button"
                aria-pressed={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                aria-label="Bullet list"
                title="Bullet list"
              >
                <EditorIcon name="list" />
              </button>
              <button
                type="button"
                aria-pressed={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                aria-label="Numbered list"
                title="Numbered list"
              >
                <EditorIcon name="ordered" />
              </button>
              <button
                type="button"
                aria-pressed={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                aria-label="Blockquote"
                title="Blockquote"
              >
                <EditorIcon name="quote" />
              </button>
              <details className="editor-link">
                <summary aria-label="Insert link" title="Insert link">
                  <EditorIcon name="link" />
                </summary>
                <div className="editor-link-popover">
                  <label>
                    Link destination
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        editor
                          .chain()
                          .focus()
                          .extendMarkRange("link")
                          .setLink({ href: contentUrl(link) })
                          .run();
                        setNotice("");
                      } catch (e) {
                        setNotice(
                          e instanceof Error ? e.message : "Invalid link",
                        );
                      }
                    }}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().unsetLink().run()}
                  >
                    Remove link
                  </button>
                </div>
              </details>
              <details
                className="editor-insert"
                onToggle={(event) => {
                  if (!event.currentTarget.open) return;
                  const menu = event.currentTarget.querySelector<HTMLElement>(
                    ".editor-insert-menu",
                  );
                  if (menu)
                    menu.style.setProperty(
                      "--editor-menu-top",
                      `${menu.getBoundingClientRect().top}px`,
                    );
                }}
              >
                <summary>
                  <EditorIcon name="add" />
                  <span>Insert block</span>
                  <EditorIcon name="down" />
                </summary>
                <div className="editor-insert-menu">
                  <span className="editor-menu-label">CONTENT BLOCKS</span>
                  {Object.entries(blockLabels)
                    .filter(
                      ([value]) =>
                        ![
                          "mediaCards",
                          "pillars",
                          "certificationPanel",
                        ].includes(value) || blockSet === "quality",
                    )
                    .map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        title={blockDescriptions[value]}
                        onClick={(e) => {
                          add(value);
                          e.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                        }}
                      >
                        <span className="editor-insert-icon">
                          <EditorIcon name={value} />
                        </span>
                        <span>
                          {label}
                          <small className="editor-block-description">
                            {blockDescriptions[value]}
                          </small>
                        </span>
                      </button>
                    ))}
                </div>
              </details>
            </>
          )}
          <div className="editor-toolbar-end">
            <button
              type="button"
              aria-label="Undo"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
            >
              <EditorIcon name="undo" />
            </button>
            <button
              type="button"
              aria-label="Redo"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
            >
              <EditorIcon name="redo" />
            </button>
          </div>
        </div>
        {notice && <p role="alert">{notice}</p>}
        {editor.isActive("blockquote") && (
          <label className="editor-context-field">
            Quote attribution
            <input
              value={editor.getAttributes("blockquote").citation || ""}
              onChange={(e) =>
                editor.commands.updateAttributes("blockquote", {
                  citation: e.target.value,
                })
              }
            />
          </label>
        )}
        {editor.isActive("heading") && !compact && (
          <label className="editor-context-field">
            <input
              type="checkbox"
              checked={Boolean(
                editor.getAttributes("heading").hideFromContents,
              )}
              onChange={(e) =>
                editor.commands.updateAttributes("heading", {
                  hideFromContents: e.target.checked,
                })
              }
            />{" "}
            Hide from article contents
          </label>
        )}
        {selectedBlock && !compact && (
          <label className="editor-context-field">
            <input
              type="checkbox"
              checked={editor.getAttributes(selectedBlock).visible !== false}
              onChange={(e) =>
                editor.commands.updateAttributes(selectedBlock, {
                  visible: e.target.checked,
                })
              }
            />{" "}
            Show selected content on the website
          </label>
        )}
        {!compact && editable && <SelectionMenu editor={editor} />}
        <EditorContent editor={editor} />
        {!compact && (
          <div className="editor-outline">
            <span>
              <EditorIcon name="outline" />
              Article contents
            </span>
            {headings.length ? (
              headings.map((h) => (
                <button
                  type="button"
                  key={h.id}
                  onClick={() => {
                    editor.state.doc.descendants((node, pos) => {
                      if (node.attrs.id === h.id) {
                        editor
                          .chain()
                          .focus()
                          .setTextSelection(pos + 1)
                          .run();
                        return false;
                      }
                    });
                  }}
                >
                  {h.text || "Untitled section"}
                </button>
              ))
            ) : (
              <small>
                Add section headings to generate the contents automatically.
              </small>
            )}
          </div>
        )}
      </div>
    </EditorContext.Provider>
  );
}
