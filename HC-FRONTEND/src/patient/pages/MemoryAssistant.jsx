import { useState, useRef, useEffect } from "react";
import PatientLayout from "../layouts/PatientLayout";
import "../styles/MemoryAssistant.css";
import api from "../../services/api";

const SparklesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" opacity="0.75" />
        <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.75" />
    </svg>
);

const BrainIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
);

const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const UploadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

function MemoryAssistant() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "assistant",
            text: "Hello! I am your Personal Memory Assistant. Ask me about your medications, appointments, reports, health history, or memory concerns. What would you like to know?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const messagesEndRef = useRef(null);

    // Fetch past chat history and patient profile on mount
    useEffect(() => {
        const fetchHistoryAndProfile = async () => {
            try {
                const { data } = await api.get("/ai/history");
                if (data && data.success && data.history && data.history.length > 0) {
                    setMessages(data.history);
                }
            } catch (err) {
                console.error("Failed to load conversation history for Memory AI:", err);
            }
        };
        fetchHistoryAndProfile();
    }, []);

    // Auto-scroll to the bottom of the chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = async (textToSend) => {
        if (!textToSend.trim()) return;

        // Append user message
        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            // Live AI RAG API request
            const { data } = await api.post("/rag/chat", { message: textToSend });
            
            if (data && data.success) {
                const assistantMsg = {
                    id: Date.now() + 1,
                    sender: "assistant",
                    text: data.answer,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                throw new Error("AI query failed");
            }
        } catch (err) {
            console.error("AI Error:", err);
            const errorMsg = {
                id: Date.now() + 1,
                sender: "assistant",
                text: "I'm sorry, but I had trouble reading your medical files just now. Please try again, or ask your caregiver to help you.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            alert("Only PDF medical files can be uploaded.");
            return;
        }

        setIsUploading(true);
        
        // Add a temporary "reading file" assistant message to the chat
        const tempMsgId = Date.now();
        const tempMsg = {
            id: tempMsgId,
            sender: "assistant",
            text: `Reading your medical file "${file.name}"... Please wait a moment.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, tempMsg]);

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const { data } = await api.post("/rag/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            if (data && data.success) {
                // Update the temporary message to show success
                setMessages(prev => prev.map(msg => {
                    if (msg.id === tempMsgId) {
                        return {
                            ...msg,
                            text: `I have successfully read and indexed your medical report: "${file.name}".\n\nYou can now ask me questions about it!`
                        };
                    }
                    return msg;
                }));
            } else {
                throw new Error("Failed to process report");
            }
        } catch (err) {
            console.error("Upload error:", err);
            // Update the temporary message to show error
            setMessages(prev => prev.map(msg => {
                if (msg.id === tempMsgId) {
                    return {
                        ...msg,
                        text: `I'm sorry, but I had trouble reading your medical file "${file.name}". Please try uploading again, or ask your caregiver to help you.`
                    };
                }
                return msg;
            }));
        } finally {
            setIsUploading(false);
            // Clear the input value so the same file can be uploaded again if needed
            e.target.value = "";
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSendMessage(inputValue);
        }
    };

    const suggestions = [
        "What medicines am I taking?",
        "When is my next appointment?",
        "What diagnose health conditions do I have?",
        "Who is my primary doctor?"
    ];

    const clearChat = async () => {
        try {
            await api.delete("/ai/history");
            setMessages([
                {
                    id: 1,
                    sender: "assistant",
                    text: "Chat cleared. I am ready for your questions. What would you like to know about your health profile?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } catch (err) {
            console.error("Failed to clear chat history", err);
            alert("Failed to clear chat history. Please try again.");
        }
    };

    return (
        <PatientLayout>
            <div className="memory-assistant-container">
                <div style={{ marginBottom: "20px" }}>
                    <h2 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>🧠 Personal Memory Assistant</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                        Ask about your medications, appointments, reports, health history and memory concerns.
                    </p>
                </div>

                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar-status">
                                <div className="chat-avatar">
                                    <BrainIcon />
                                </div>
                                <span className="status-indicator"></span>
                            </div>
                            <div className="chat-header-text">
                                <h3>Memory AI</h3>
                                <p>
                                    <SparklesIcon /> Online & Active
                                </p>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <button className="chat-action-btn" onClick={clearChat} title="Clear Chat History">
                                🗑️ Clear
                            </button>
                        </div>
                    </div>

                    {/* Messages list */}
                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`chat-message ${msg.sender}`}>
                                <div className="message-bubble">
                                    <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
                                    <span className="message-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-message assistant">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions chips */}
                    <div className="chat-suggestions">
                        {suggestions.map((sug, idx) => (
                            <button
                                key={idx}
                                className="suggestion-chip"
                                onClick={() => handleSendMessage(sug)}
                                disabled={isTyping || isUploading}
                            >
                                {sug}
                            </button>
                        ))}
                    </div>

                    {/* Input box */}
                    <div className="chat-input-area">
                        <label className={`upload-pdf-btn ${(isTyping || isUploading) ? "disabled" : ""}`} title="Upload Medical Report PDF">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                style={{ display: "none" }}
                                disabled={isTyping || isUploading}
                            />
                            <UploadIcon />
                        </label>
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Ask about medications, appointments, symptoms..."
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping || isUploading}
                            />
                            <span className="chat-input-icon">🧠</span>
                        </div>
                        <button
                            className="send-message-btn"
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || isTyping || isUploading}
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}

export default MemoryAssistant;
