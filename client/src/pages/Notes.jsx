import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  generateAiSummary,
} from "../store/notesSlice";
import { Sparkles, Trash2, X } from "lucide-react";

const Notes = () => {
  const dispatch = useDispatch();
  const { items, status, error, summaryLoadingId } = useSelector(
    (state) => state.notes
  );

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Edit fields for selected note
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Form states for creating new note
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchNotes());
    }
  }, [dispatch, status]);

  // Synchronize modal inputs when a note is opened
  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title || "");
      setEditContent(selectedNote.content || "");
    }
  }, [selectedNote?._id]);

  // Keep selectedNote in sync with Redux store updates (e.g. after AI summary generation)
  useEffect(() => {
    if (selectedNote) {
      const updated = items.find((n) => n._id === selectedNote._id);
      if (updated) {
        setSelectedNote(updated);
      }
    }
  }, [items]);

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }, [items, search]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Title and content are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await dispatch(
      createNote({
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : ["General"],
      })
    );

    setSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      setTitle("");
      setContent("");
      setTagInput("");
      setShowAddModal(false);
    } else {
      setFormError(result.payload || "Failed to create note");
    }
  };

  // Auto-save edited note when leaving title/content input or closing modal
  const handleSaveEdit = () => {
    if (!selectedNote) return;
    if (
      editTitle.trim() !== selectedNote.title ||
      editContent.trim() !== selectedNote.content
    ) {
      if (editTitle.trim() && editContent.trim()) {
        dispatch(
          updateNote({
            id: selectedNote._id,
            updates: {
              title: editTitle.trim(),
              content: editContent.trim(),
            },
          })
        );
      }
    }
  };

  const handleCloseModal = () => {
    handleSaveEdit();
    setSelectedNote(null);
  };

  const handleDelete = (id, noteTitle, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Delete note "${noteTitle}"?`)) {
      dispatch(deleteNote(id));
      if (selectedNote?._id === id) setSelectedNote(null);
    }
  };

  const handleAiSummary = (id, e) => {
    if (e) e.stopPropagation();
    dispatch(generateAiSummary(id));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Interview prep notes
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          + New note
        </button>
      </div>

      {/* Search Input */}
      <div className="mt-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes by title, content or tag..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div className="mt-12 text-center text-sm text-gray-400">
          Loading notes…
        </div>
      )}

      {/* Error state */}
      {status === "failed" && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Failed to load notes."}
        </div>
      )}

      {/* Empty State */}
      {status === "succeeded" && filteredNotes.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-lg font-bold text-gray-900">
            {items.length === 0 ? "No notes created yet" : "No matching notes found"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {items.length === 0
              ? "Keep key interview concepts, system design topics, and company-specific notes organized here."
              : "Try adjusting your search query."}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
            >
              Add your first note
            </button>
          )}
        </div>
      )}

      {/* Notes List */}
      {status === "succeeded" && filteredNotes.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              onClick={() => setSelectedNote(note)}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm relative group overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900 break-words [word-break:break-word] flex-1">
                  {note.title}
                </h3>
                <button
                  onClick={(e) => handleDelete(note._id, note.title, e)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 shrink-0"
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Content preview */}
              <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2 break-words [word-break:break-word]">
                {note.content}
              </p>

              {/* AI Summary Block (if generated) */}
              {note.aiSummary && (
                <div className="mt-4 rounded-xl bg-purple-50/70 p-4 border border-purple-100 text-sm text-purple-950">
                  <div className="flex items-center gap-1.5 font-bold text-purple-900 mb-1">
                    <Sparkles size={14} className="text-purple-600" />
                    <span>AI Summary</span>
                  </div>
                  <div className="line-clamp-2 whitespace-pre-wrap break-words [word-break:break-word] text-purple-800 leading-relaxed">
                    {note.aiSummary}
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {(note.tags?.length > 0 ? note.tags : ["General"]).map(
                    (tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>

                <button
                  onClick={(e) => handleAiSummary(note._id, e)}
                  disabled={summaryLoadingId === note._id}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Sparkles size={14} className="text-purple-600" />
                  <span>
                    {summaryLoadingId === note._id
                      ? "Generating..."
                      : "AI summary"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW & LIVE-EDIT NOTE DETAIL MODAL */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex-1 mr-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Tap title to edit
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveEdit}
                  placeholder="Note Title..."
                  className="text-xl font-bold text-gray-900 w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none py-1 transition-colors"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(selectedNote.tags?.length > 0
                    ? selectedNote.tags
                    : ["General"]
                  ).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
              >
                <X size={22} />
              </button>
            </div>

            {/* Editable Content */}
            <div className="mt-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Tap content to edit
              </label>
              <textarea
                rows={8}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleSaveEdit}
                placeholder="Write your note content here..."
                className="w-full text-sm text-gray-800 leading-relaxed rounded-xl bg-gray-50/70 p-4 border border-gray-200 focus:border-gray-400 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* AI Summary Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  AI Summary
                </h3>
                {!selectedNote.aiSummary && (
                  <button
                    onClick={(e) => handleAiSummary(selectedNote._id, e)}
                    disabled={summaryLoadingId === selectedNote._id}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Sparkles size={12} />
                    {summaryLoadingId === selectedNote._id
                      ? "Generating..."
                      : "Generate AI Summary"}
                  </button>
                )}
              </div>

              {selectedNote.aiSummary ? (
                <div className="rounded-xl bg-purple-50 p-4 border border-purple-100 text-sm text-purple-950 whitespace-pre-wrap break-words leading-relaxed">
                  {selectedNote.aiSummary}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No AI summary generated yet. Click "Generate AI Summary" to create one using OpenAI.
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={(e) => handleDelete(selectedNote._id, selectedNote.title, e)}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 size={14} />
                Delete note
              </button>
              <button
                onClick={handleCloseModal}
                className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW NOTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add new note</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="mt-4 flex flex-col gap-4">
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google — System Design prep"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Topic / Company Tag
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. Google, System Design"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Revise load balancing, caching strategies, database sharding..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;