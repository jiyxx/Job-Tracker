import { Check } from "lucide-react";

const renderInline = (text) => {
  if (!text) return text;

  // Clean up any empty or invalid markdown artifacts like **** or ___
  const cleaned = text.replace(/\*{4,}/g, "").replace(/_{4,}/g, "");

  // Match: `code`, ***bold-italic***, **bold**, *italic*, _italic_
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={key}
          className="rounded bg-purple-100/80 px-1.5 py-0.5 font-mono text-xs font-medium text-purple-900"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={key} className="font-semibold italic text-gray-900">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={key} className="font-semibold text-gray-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      parts.push(
        <em key={key} className="italic text-gray-800">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < cleaned.length) {
    parts.push(cleaned.slice(lastIndex));
  }

  return parts.length > 0 ? parts : cleaned;
};

const SummaryRenderer = ({ text, className = "" }) => {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      blocks.push({ type: "list", items: currentList.items, key: currentList.key });
    }
    currentList = null;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Ignore horizontal rule lines (e.g., "---", "***", "___")
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushList();
      return;
    }

    const headingMatch = line.match(/^#{1,3}\s+(.*)$/);
    if (headingMatch) {
      flushList();
      blocks.push({ type: "heading", text: headingMatch[1], key: `heading-${index}` });
      return;
    }

    const listMatch = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      if (!currentList) {
        currentList = { items: [], key: `list-${index}` };
      }

      let itemContent = listMatch[1];
      let isCheckbox = false;
      let isChecked = false;

      const checkboxMatch = itemContent.match(/^\[([ xX]?)\]\s*(.*)$/);
      if (checkboxMatch) {
        isCheckbox = true;
        isChecked = checkboxMatch[1].toLowerCase() === "x";
        itemContent = checkboxMatch[2];
      }

      currentList.items.push({
        text: itemContent,
        isCheckbox,
        isChecked,
      });
      return;
    }

    flushList();
    blocks.push({ type: "paragraph", text: line, key: `para-${index}` });
  });

  flushList();

  const sections = [];
  let currentSection = null;

  const flushSection = () => {
    if (currentSection) {
      sections.push(currentSection);
    }
    currentSection = null;
  };

  blocks.forEach((block) => {
    if (block.type === "heading") {
      flushSection();
      currentSection = {
        title: block.text,
        key: block.key,
        items: [],
      };
      return;
    }

    if (!currentSection) {
      currentSection = {
        title: null,
        key: `section-${block.key}`,
        items: [],
      };
    }

    currentSection.items.push(block);
  });

  flushSection();

  const visibleSections = sections.filter((section) => section.items.length > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleSections.map((section, sectionIndex) => (
        <section
          key={section.key || `section-${sectionIndex}`}
          className="overflow-hidden rounded-xl border border-purple-100 bg-purple-50/60 shadow-sm"
        >
          {section.title && (
            <div className="border-b border-purple-100 px-4 py-3 bg-purple-50/80">
              <h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-purple-900">
                {renderInline(section.title)}
              </h4>
            </div>
          )}

          <div className="px-4 py-4 sm:px-5">
            {section.items.map((block) => {
              if (block.type === "list") {
                return (
                  <ul key={block.key} className="space-y-2 text-sm leading-relaxed text-gray-700">
                    {block.items.map((itemObj, itemIndex) => {
                      const text = typeof itemObj === "string" ? itemObj : itemObj.text;
                      const isCheckbox = typeof itemObj === "object" && itemObj.isCheckbox;
                      const isChecked = typeof itemObj === "object" && itemObj.isChecked;

                      return (
                        <li key={`${block.key}-${itemIndex}`} className="flex items-start gap-2.5">
                          {isCheckbox ? (
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                isChecked
                                  ? "border-purple-600 bg-purple-600 text-white"
                                  : "border-purple-300 bg-white text-purple-600"
                              }`}
                            >
                              {isChecked && <Check size={11} strokeWidth={3} />}
                            </span>
                          ) : (
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                          )}
                          <span className="flex-1">{renderInline(text)}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              return (
                <p
                  key={block.key}
                  className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap break-words"
                >
                  {renderInline(block.text)}
                </p>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SummaryRenderer;