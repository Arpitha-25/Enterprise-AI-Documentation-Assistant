import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Loader2, Trash2, RotateCcw, ShieldAlert, FileIcon,
  Layers, HardDrive, Calendar, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Individual Document Row component to poll its status if processing
function DocumentRow({ doc, onUpdateStatus, onDelete }) {
  const isProcessing = doc.processingStatus === "PROCESSING" || 
                       doc.processingStatus === "UPLOADED" || 
                       doc.processingStatus === "INDEXING";

  // Use React Query to poll status if active
  const { data: statusData } = useQuery({
    queryKey: ["documentStatus", doc.id],
    queryFn: async () => {
      const response = await api.get(`/api/documents/${doc.id}/status`);
      return response.data;
    },
    enabled: isProcessing,
    refetchInterval: isProcessing ? 2000 : false,
  });

  // Keep parent state updated when status changes
  useEffect(() => {
    if (statusData && statusData.processingStatus !== doc.processingStatus) {
      onUpdateStatus(doc.id, statusData.processingStatus);
    }
  }, [statusData, doc.processingStatus, doc.id, onUpdateStatus]);

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-550 border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Ready
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            Processing
          </span>
        );
      case "INDEXING":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 animate-pulse">
            <Layers size={12} />
            Indexing
          </span>
        );
      case "UPLOADED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Loader2 size={12} className="animate-spin" />
            Uploaded
          </span>
        );
      case "FAILED":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-550 border border-red-500/20">
            <AlertTriangle size={12} />
            Failed
          </span>
        );
    }
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition duration-150 border-b border-slate-100 dark:border-slate-850">
      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2.5 max-w-xs md:max-w-md">
          <FileText className="text-slate-400 dark:text-slate-550 shrink-0" size={18} />
          <span className="truncate block font-semibold" title={doc.fileName}>{doc.fileName}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">
        <div className="flex items-center gap-1">
          <HardDrive size={13} className="text-slate-400" />
          {formatSize(doc.fileSize)}
        </div>
      </td>
      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">
        <div className="flex items-center gap-1">
          <Calendar size={13} className="text-slate-400" />
          {formatDate(doc.uploadedAt)}
        </div>
      </td>
      <td className="py-4 px-4 select-none">
        {getStatusBadge(doc.processingStatus)}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {doc.processingStatus === "FAILED" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => onUpdateStatus(doc.id, "RETRY_TRIGGERED")}
              className="text-blue-500 border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-950/20 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Retry
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onDelete(doc.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function Documents() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  // States
  const [documents, setDocuments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  
  // Storage for failed files so we can retry uploading
  const [retryQueue, setRetryQueue] = useState({});

  const cacheKey = `uploaded_docs_${user?.email}`;

  // Load from cache on initialization
  useEffect(() => {
    const cachedDocs = localStorage.getItem(cacheKey);
    if (cachedDocs) {
      try {
        setDocuments(JSON.parse(cachedDocs));
      } catch (e) {
        console.error("Failed to parse cached docs", e);
      }
    }
  }, [user]);

  // React Query Mutation to handle PDF uploads
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      return { response: response.data, file };
    },
    onMutate: () => {
      setUploadProgress(0);
      setUploadError("");
    },
    onSuccess: ({ response: newDoc, file }) => {
      setDocuments(prev => {
        const updated = [newDoc, ...prev];
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      // Remove from retry queue if it was there
      setRetryQueue(prev => {
        const copy = { ...prev };
        delete copy[file.name];
        return copy;
      });
    },
    onError: (error, file) => {
      const msg = error.response?.data?.message || "Failed to upload document. Please verify connection.";
      setUploadError(msg);
      // Cache file object for retry
      setRetryQueue(prev => ({ ...prev, [file.name]: file }));
    }
  });

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file) => {
    if (file.type !== "application/pdf") {
      setUploadError("Invalid file type. Only PDF document files are allowed.");
      return;
    }
    setUploadError("");
    uploadMutation.mutate(file);
  };

  // Delete document (cached locally)
  const handleDeleteDocument = (id) => {
    if (!confirm("Are you sure you want to remove this document from workspace?")) return;
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });
  };

  // Status updates from polling row, or retry trigger
  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === "RETRY_TRIGGERED") {
      const doc = documents.find(d => d.id === id);
      if (doc && retryQueue[doc.fileName]) {
        // Trigger upload using stored File object
        setDocuments(prev => prev.filter(d => d.id !== id)); // Remove old failed record
        validateAndUpload(retryQueue[doc.fileName]);
      } else {
        // Fallback: prompt for file selection again
        alert(`File context for '${doc?.fileName || "document"}' lost. Please drop the PDF here again.`);
        handleDeleteDocument(id);
        triggerFileInput();
      }
      return;
    }

    setDocuments(prev => {
      const updated = prev.map(doc => doc.id === id ? { ...doc, processingStatus: newStatus } : doc);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* 1. Header Details */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          Documentation Upload
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
          Drag and drop your switch manuals, routing topologies, or config logs. Once uploaded, files are indexed into ChromaDB.
        </p>
      </div>

      {/* 2. Drag & Drop File Upload Area */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow">
        <CardContent className="p-6">
          <form 
            onDragEnter={handleDrag} 
            onDragOver={handleDrag} 
            onDragLeave={handleDrag} 
            onDrop={handleDrop}
            onSubmit={(e) => e.preventDefault()}
            className={`
              relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-200
              ${dragActive 
                ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 scale-[0.99]" 
                : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-950/10"}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 shadow-sm shadow-blue-500/5">
              <UploadCloud size={28} />
            </div>

            <h3 className="font-semibold text-slate-800 dark:text-white text-base">
              Drag & Drop your documentation PDF here
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              Only PDF format manuals or port mappings are supported. Max file limit is 100MB.
            </p>

            <Button
              type="button"
              onClick={triggerFileInput}
              variant="outline"
              className="mt-6 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-900 shadow-xs rounded-lg"
            >
              Browse Local Files
            </Button>
          </form>

          {/* Upload Progress & Errors */}
          {(uploadMutation.isPending || uploadError) && (
            <div className="mt-6 p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10 space-y-3">
              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin text-blue-500" size={14} />
                      Uploading file to server...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-md"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-start gap-2.5 text-xs text-red-500 font-medium leading-normal bg-red-500/5 p-3 rounded-lg border border-red-900/20">
                  <ShieldAlert className="shrink-0 mt-0.5 text-red-500" size={15} />
                  <div>
                    <span className="font-bold">Upload Error</span>
                    <p className="text-xxs text-red-400 mt-0.5 leading-normal">{uploadError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Recent Uploads Documentation List */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow">
        <CardHeader className="border-b border-slate-100 dark:border-slate-850 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-850 dark:text-slate-150">
              Recent Documentation Uploads
            </CardTitle>
            <CardDescription className="text-slate-450 dark:text-slate-500 text-xs">
              Track vectorization job statuses and remove or retry document indexes.
            </CardDescription>
          </div>
          <span className="bg-blue-500/10 text-blue-550 border border-blue-500/20 rounded-lg text-xs font-semibold px-2.5 py-1">
            Total Indexed: {documents.length}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {documents.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-550 max-w-sm mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                <FileIcon size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Workspace is empty</p>
                <p className="text-xs">Drag a manual PDF above to initialize the LLM context data.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/40 text-slate-450 dark:text-slate-500 text-xxs uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-850 select-none">
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">File Size</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Indexed At</th>
                  <th className="py-3.5 px-4">Vector Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

export default Documents;