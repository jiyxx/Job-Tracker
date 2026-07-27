const INLINE_BOLD_REGEX = /\*\*(.*?)\*\*/g;

const renderInline = (text) => {
  const parts = [];
  let lastIndex = 0;
  let match;

  INLINE_BOLD_REGEX.lastIndex = 0;

  while ((match = INLINE_BOLD_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(
      <strong key={`${match.index}-${match[1]}`} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
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
      currentList.items.push(listMatch[1]);
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
          className="overflow-hidden rounded-xl border border-purple-100 bg-purple-50/60"
        >
          {section.title && (
            <div className="border-b border-purple-100 px-4 py-3">
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
                    {block.items.map((item, itemIndex) => (
                      <li key={`${block.key}-${itemIndex}`} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                        <span>{renderInline(item)}</span>
                      </li>
                    ))}
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