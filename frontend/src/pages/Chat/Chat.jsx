import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { 
  MessageSquare, Send, Plus, UploadCloud, FileText, 
  CheckCircle2, AlertTriangle, Loader2, Sparkles, 
  Menu, X, BookOpen, Clock, Trash2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function Chat() {
  const { user } = useAuth();
  
  // State variables
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  
  // Loading & status states
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Polling state for current document being processed
  const [processingDoc, setProcessingDoc] = useState(null);
  
  // Sidebar visibility on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cache key for user documents
  const cacheKey = `uploaded_docs_${user?.email}`;

  // 1. Initial Load: load history and documents
  useEffect(() => {
    loadHistory();
    // Load documents from cache first
    const cachedDocs = localStorage.getItem(cacheKey);
    if (cachedDocs) {
      try {
        setDocuments(JSON.parse(cachedDocs));
      } catch (e) {
        console.error("Error parsing cached docs", e);
      }
    }
  }, [user]);

  // 2. Poll document status if one is processing
  useEffect(() => {
    if (!processingDoc) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/documents/${processingDoc.id}/status`);
        const updatedDoc = response.data;
        
        // Update documents list
        setDocuments(prevDocs => {
          const nextDocs = prevDocs.map(d => d.id === updatedDoc.id ? { ...d, processingStatus: updatedDoc.processingStatus } : d);
          localStorage.setItem(cacheKey, JSON.stringify(nextDocs));
          return nextDocs;
        });

        // Update selected document if applicable
        if (selectedDoc && selectedDoc.id === updatedDoc.id) {
          setSelectedDoc(prev => ({ ...prev, processingStatus: updatedDoc.processingStatus }));
        }

        if (updatedDoc.processingStatus === "READY" || updatedDoc.processingStatus === "FAILED") {
          setProcessingDoc(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error polling document status", err);
        setProcessingDoc(null);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [processingDoc, selectedDoc]);

  // 3. Auto Scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Load history from backend
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get("/api/history");
      const historyList = response.data || [];
      setHistory(historyList);
      
      // Proactively resolve document details (like filename) from history
      resolveDocumentsFromHistory(historyList);
    } catch (error) {
      console.error("Error loading chat history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Resolve document filenames for documentId values retrieved from history
  const resolveDocumentsFromHistory = async (historyList) => {
    // Get unique document IDs that we don't already have details for
    const existingDocIds = new Set(documents.map(d => d.id));
    const uniqueHistoryIds = [...new Set(historyList.map(h => h.documentId))].filter(id => id && !existingDocIds.has(id));

    if (uniqueHistoryIds.length === 0) return;

    const resolvedDocs = [];
    for (const docId of uniqueHistoryIds) {
      try {
        const response = await api.get(`/api/documents/${docId}/status`);
        resolvedDocs.push(response.data);
      } catch (err) {
        // Document might be deleted on backend, create a placeholder
        resolvedDocs.push({
          id: docId,
          fileName: `Document #${docId}`,
          processingStatus: "READY"
        });
      }
    }

    if (resolvedDocs.length > 0) {
      setDocuments(prevDocs => {
        const merged = [...prevDocs, ...resolvedDocs].reduce((acc, current) => {
          if (!acc.find(item => item.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);
        localStorage.setItem(cacheKey, JSON.stringify(merged));
        return merged;
      });
    }
  };

  // Handle Document Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed.");
      return;
    }

    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newDoc = response.data;
      
      // Add new document to state & cache
      setDocuments(prev => {
        const updated = [newDoc, ...prev];
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });

      setSelectedDoc(newDoc);
      
      // Trigger status polling
      if (newDoc.processingStatus !== "READY" && newDoc.processingStatus !== "FAILED") {
        setProcessingDoc(newDoc);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload document.";
      setUploadError(msg);
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Reset/Create New Chat
  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedDoc || sending) return;

    if (selectedDoc.processingStatus !== "READY") {
      alert("This document is still processing. Please wait until it is ready.");
      return;
    }

    const questionText = input;
    setInput("");
    
    // Add user message to screen
    setMessages(prev => [...prev, { role: "user", content: questionText }]);
    setSending(true);

    try {
      const response = await api.post("/api/chat/ask", {
        question: questionText,
        documentId: selectedDoc.id
      });

      const { answer, sources } = response.data;
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: answer || "I couldn't generate an answer.", 
        sources: sources || [] 
      }]);

      // Reload history to display this QA pair in the sidebar
      loadHistory();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to get AI response. Please try again.";
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Error: ${errMsg}`,
        isError: true 
      }]);
    } finally {
      setSending(false);
    }
  };

  // Clear all history
  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your chat history?")) return;
    try {
      await api.delete("/api/history");
      setHistory([]);
      setMessages([]);
    } catch (err) {
      console.error("Failed to delete history", err);
    }
  };

  // Load a historical chat into the chat window
  const handleSelectHistoryItem = (item) => {
    // Find or add document to list
    const foundDoc = documents.find(d => d.id === item.documentId);
    if (foundDoc) {
      setSelectedDoc(foundDoc);
    } else {
      setSelectedDoc({
        id: item.documentId,
        fileName: `Document #${item.documentId}`,
        processingStatus: "READY"
      });
    }

    // Set messages to the historical Q&A
    setMessages([
      { role: "user", content: item.question },
      { role: "assistant", content: item.answer, sources: [] }
    ]);
    
    // Close sidebar on mobile
    setSidebarOpen(false);
  };

  // Select document directly
  const handleSelectDocument = (doc) => {
    setSelectedDoc(doc);
    if (doc.processingStatus !== "READY" && doc.processingStatus !== "FAILED") {
      setProcessingDoc(doc);
    }
    // Don't clear message log to allow querying another document in thread, 
    // or clear if user wants clean slate. Let's keep it but start a new chat if they want.
  };

  // --- CUSTOM MARKDOWN RENDERER ---
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // If code block
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split("\n");
        let language = "";
        let code = codeContent;
        if (lines.length > 0 && !lines[0].includes(" ") && lines[0].length < 15) {
          language = lines[0];
          code = lines.slice(1).join("\n");
        }
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-900 px-4 py-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center select-none">
              <span>{language || "code"}</span>
            </div>
            <pre className="bg-slate-950 text-slate-200 p-4 font-mono text-xs md:text-sm overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      
      // Inline elements (bold, inline code) & lists
      const lines = part.split("\n");
      return lines.map((line, lineIndex) => {
        // List item
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const itemText = line.trim().substring(2);
          return (
            <ul key={`${index}-${lineIndex}`} className="list-disc pl-6 mb-1 text-slate-700 dark:text-slate-300">
              <li>{parseInlineElements(itemText)}</li>
            </ul>
          );
        }
        
        if (line.trim() === "") {
          return <div key={`${index}-${lineIndex}`} className="h-2"></div>;
        }
        
        return (
          <p key={`${index}-${lineIndex}`} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
            {parseInlineElements(line)}
          </p>
        );
      });
    });
  };

  const parseInlineElements = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={index} className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded font-mono text-xs border border-slate-200 dark:border-slate-700/60">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-colors duration-250 relative">
      
      {/* 1. Mobile Sidebar Hamburger */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="absolute top-4 left-4 z-20 md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <Menu size={20} />
      </button>

      {/* 2. Sidebar Workspace */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 md:relative md:translate-x-0
        bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-850
        flex flex-col p-4 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile Sidebar Close Button */}
        <div className="flex md:hidden justify-end mb-2">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-850"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <Button 
          onClick={handleNewChat}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-slate-350 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 h-9 rounded-lg font-medium text-slate-700 dark:text-slate-300 mb-6 shrink-0"
        >
          <Plus size={16} />
          New Chat
        </Button>

        {/* Section A: Document Selection & Upload */}
        <div className="mb-6 flex flex-col min-h-0 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
            <BookOpen size={13} />
            Documents
          </div>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf" 
            className="hidden" 
          />

          {/* Upload Document Button */}
          <button 
            onClick={triggerFileInput}
            disabled={uploading}
            className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-medium transition cursor-pointer mb-3 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-blue-500" size={16} />
            ) : (
              <UploadCloud className="text-slate-400" size={16} />
            )}
            {uploading ? "Uploading PDF..." : "Upload PDF Documentation"}
          </button>

          {uploadError && (
            <p className="text-xxs text-red-500 font-medium mb-2 leading-tight bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900/40">
              {uploadError}
            </p>
          )}

          {/* Scrollable list of uploaded documents */}
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2 italic">No documents uploaded</p>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDoc && selectedDoc.id === doc.id;
                const isDocProcessing = doc.processingStatus === "PROCESSING" || doc.processingStatus === "UPLOADED" || doc.processingStatus === "INDEXING";
                
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`
                      flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none
                      ${isSelected 
                        ? "bg-blue-600 text-white shadow shadow-blue-500/20" 
                        : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/40"}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText size={14} className={isSelected ? "text-white" : "text-slate-400"} />
                      <span className="text-xs font-medium truncate block">{doc.fileName}</span>
                    </div>

                    <div className="ml-2 shrink-0">
                      {doc.processingStatus === "READY" && (
                        <CheckCircle2 size={12} className={isSelected ? "text-white" : "text-emerald-500"} />
                      )}
                      {isDocProcessing && (
                        <Loader2 size={12} className={`animate-spin ${isSelected ? "text-white" : "text-blue-500"}`} />
                      )}
                      {doc.processingStatus === "FAILED" && (
                        <AlertTriangle size={12} className="text-red-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section B: Conversation History */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2 shrink-0">
            <span className="flex items-center gap-2">
              <Clock size={13} />
              Recent History
            </span>
            {history.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="text-xxs text-red-500 hover:text-red-400 font-medium normal-case flex items-center gap-1 cursor-pointer transition"
                title="Clear all history"
              >
                <Trash2 size={11} />
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {historyLoading ? (
              <div className="flex flex-col gap-2 py-4 items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={16} />
                <span className="text-xxs text-slate-400">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">No past conversations</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/40 text-left cursor-pointer transition flex items-start gap-2 group"
                >
                  <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.question}
                    </p>
                    <span className="text-xxs text-slate-400 dark:text-slate-500 block truncate">
                      {item.answer ? item.answer.substring(0, 40) + "..." : ""}
                    </span>
                  </div>
                  <ChevronRightIcon className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500 shrink-0 self-center" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* User identification */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-850 flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 flex items-center justify-center font-bold text-xs select-none">
            {user?.email?.substring(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.email}</p>
            <span className="text-xxs text-slate-400 dark:text-slate-500 block">Workspace Member</span>
          </div>
        </div>
      </aside>

      {/* 3. Main Chat Window */}
      <main className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 relative">
        
        {/* Chat Area Top Bar */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-850 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 ml-10 md:ml-0 min-w-0">
            {selectedDoc ? (
              <>
                <FileText className="text-blue-500 shrink-0" size={16} />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {selectedDoc.fileName}
                </span>
                <span className={`
                  text-xxs font-semibold px-2 py-0.5 rounded-full shrink-0
                  ${selectedDoc.processingStatus === "READY" ? "bg-emerald-500/10 text-emerald-500" : ""}
                  ${selectedDoc.processingStatus === "FAILED" ? "bg-red-500/10 text-red-500" : ""}
                  ${selectedDoc.processingStatus !== "READY" && selectedDoc.processingStatus !== "FAILED" ? "bg-blue-500/10 text-blue-500 animate-pulse" : ""}
                `}>
                  {selectedDoc.processingStatus}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 italic">No Document Selected</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles size={16} className="text-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-400">RAG Engine V1</span>
          </div>
        </div>

        {/* Message Thread Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Empty state landing page */
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 animate-fade-in py-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/5">
                <Sparkles size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-850 dark:text-slate-150">Welcome to NetPilot Assistant</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select an uploaded PDF from the sidebar or upload your network schema configurations, switch documents, and query them using natural language.
                </p>
              </div>

              {!selectedDoc && (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl max-w-md w-full flex items-start gap-3 text-left">
                  <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Retrieval Document Required</span>
                    <p className="text-xxs text-slate-550 dark:text-slate-400 mt-1 leading-normal">
                      Please upload and select a documentation PDF in the sidebar. The model requires an anchor document to parse switch settings, ports, and BGP routes.
                    </p>
                  </div>
                </div>
              )}

              {selectedDoc && selectedDoc.processingStatus !== "READY" && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl max-w-md w-full flex items-start gap-3 text-left">
                  <Loader2 className="text-blue-500 animate-spin shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Document Processing In Progress</span>
                    <p className="text-xxs text-slate-550 dark:text-slate-400 mt-1 leading-normal">
                      The document indexing job is running (extracting pages, vector embedding, and storing in ChromaDB). Chat controls will unlock once completed.
                    </p>
                  </div>
                </div>
              )}

              {selectedDoc && selectedDoc.processingStatus === "READY" && (
                <div className="grid grid-cols-2 gap-3 w-full text-left">
                  {[
                    "What VLAN configs are defined?",
                    "Check BGP neighbors configuration",
                    "How are trunk ports set up?",
                    "List details about access control lists"
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 text-xs font-medium text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition duration-150 flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{q}</span>
                      <ArrowRight size={12} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-500 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Chat messages */
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div 
                    key={index}
                    className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}
                  >
                    {/* Bot avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/10 shrink-0">
                        NP
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`
                      max-w-[85%] rounded-2xl p-4 shadow-sm border
                      ${isUser 
                        ? "bg-blue-600 border-blue-600 text-white rounded-br-none" 
                        : msg.isError
                          ? "bg-red-500/5 border-red-900/30 text-red-500 rounded-bl-none"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-bl-none"}
                    `}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="prose dark:prose-invert max-w-none">
                            {renderMarkdown(msg.content)}
                          </div>

                          {/* Render sources if available */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-850/80 mt-2 select-none">
                              <span className="text-xxs font-semibold text-slate-400 dark:text-slate-500 block mb-1">
                                RETRIEVED SOURCES:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.sources.map((src, sIndex) => (
                                  <span 
                                    key={sIndex}
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xxs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-850 font-medium"
                                  >
                                    {src.filename || "doc"} (Page {src.page_number})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        {user?.email?.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pulsing Typing indicator */}
              {sending && (
                <div className="flex gap-4 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                    NP
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl rounded-bl-none p-4 max-w-[85%] shadow-sm flex items-center justify-center">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form at bottom */}
        <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-850 shrink-0">
          <form 
            onSubmit={handleSendMessage} 
            className="max-w-3xl mx-auto flex items-center gap-3 relative"
          >
            <textarea
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={
                !selectedDoc 
                  ? "Select a document to unlock chat..." 
                  : selectedDoc.processingStatus !== "READY"
                    ? "Document processing... please wait."
                    : "Ask AI Assistant about documentation settings..."
              }
              disabled={!selectedDoc || selectedDoc.processingStatus !== "READY" || sending}
              className="
                flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850
                text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                rounded-xl py-3 px-4 text-sm md:text-base outline-none resize-none min-h-[46px] max-h-32 focus:border-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 pr-12
              "
            />
            
            <button
              type="submit"
              disabled={!selectedDoc || selectedDoc.processingStatus !== "READY" || sending || !input.trim()}
              className="
                absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-lg 
                bg-blue-600 hover:bg-blue-500 text-white transition-all
                disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-400 dark:disabled:text-slate-650 disabled:cursor-not-allowed cursor-pointer
              "
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="max-w-3xl mx-auto mt-2 text-center">
            <span className="text-xxs text-slate-400 dark:text-slate-500">
              AI-generated content can contain errors. Verify critical ports, IP routes, and VLAN credentials independently.
            </span>
          </div>
        </div>
      </main>

    </div>
  );
}

// Chevron Right helper
function ChevronRightIcon({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`size-3 transition group-hover:translate-x-0.5 ${className}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default Chat;