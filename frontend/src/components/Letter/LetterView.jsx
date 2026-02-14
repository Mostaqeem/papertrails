// src/components/Letter/LetterView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../axiosConfig";
import DOMPurify from "dompurify";
import "./LetterForm.css";

export default function LetterView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [letter, setLetter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLetterDetails = async () => {
            try {
                const response = await axiosInstance.get(`letters/${id}/`);
                setLetter(response.data);
            } catch (err) {
                console.error("Error fetching letter:", err);
                setError("Failed to load letter details.");
            } finally {
                setLoading(false);
            }
        };

        fetchLetterDetails();
    }, [id]);

    if (loading) return <div style={{ padding: "20px" }}>Loading details...</div>;
    if (error) return <div style={{ padding: "20px", color: "red" }}>{error}</div>;
    if (!letter) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // const getSignatoryDetails = () => {
    //     if (!letter.signatory) return "---";
    //     let name = "";
    //     let designation = "";
    //     if (letter.signatory.email && typeof letter.signatory.email === 'object') {
    //         name = letter.signatory.email.full_name || letter.signatory.email.email;
    //         designation = letter.signatory.email.designation;
    //     } else {
    //         name = letter.signatory.full_name || letter.signatory.name;
    //         designation = letter.signatory.designation;
    //     }
    //     if (name && designation) return `${name}, ${designation}`;
    //     return name || "---";
    // };

    const sanitizeHTML = (html) => {
        if (!html) return "---";
        return DOMPurify.sanitize(html, {
            ADD_TAGS: ['style'],
            ADD_ATTR: ['style', 'class', 'color', 'background-color'],
            FORBID_TAGS: ['script'],
        });
    };

    // --- Data Processing ---
    const senderOrgShort = letter.organization?.short_form;
    const myOrgCC = letter.cc_recipients?.filter(cc => cc.org_recipient_name) || [];
    const sameOrgCC = letter.cc_recipients?.filter(cc => !cc.org_recipient_name && cc.recipient_organization === senderOrgShort) || [];
    const otherOrgCC = letter.cc_recipients?.filter(cc => !cc.org_recipient_name && cc.recipient_organization !== senderOrgShort) || [];

    const renderCCItem = (cc) => {
        if (cc.org_recipient_name) return cc.org_recipient_name;
        const parts = [cc.recipient_designation, cc.recipient_department, cc.recipient_organization].filter(Boolean);
        if (parts.length > 0) return `${parts.join(", ")}`;
        return cc.recipient_name;
    };

    const internalRefs = letter?.references?.filter(ref => ref.internal_reference_number) || [];
    const externalRefs = letter?.references?.filter(ref => ref.external_reference_number) || [];

    // --- INLINE STYLES ---
    const styles = {
        container: {
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            borderBottom: "1px solid #eee",
            paddingBottom: "15px"
        },
        title: {
            fontSize: "22px",
            fontWeight: "600",
            color: "#333",
            margin: 0
        },
        backBtn: {
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
        },
        sectionLabel: {
            fontSize: "14px",
            color: "#212529",
            fontWeight: "500",
            width: "140px",
            paddingTop: "10px"
        },
        row: {
            display: "flex",
            marginBottom: "20px",
            alignItems: "flex-start"
        },
        inputWrapper: {
            flex: 1,
        },
        readOnlyInput: {
            width: "100%",
            padding: "8px 12px",
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#495057",
            backgroundColor: "#fff",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            display: "block",
            boxSizing: "border-box"
        },
        // The Grey Style requested
        readOnlyGrey: {
            backgroundColor: "#e9ecef",
            opacity: 1
        },
        htmlBox: {
            minHeight: "40px",
            padding: "8px 12px",
            backgroundColor: "#fff",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#212529"
        },
        chip: {
            display: "inline-block",
            padding: "5px 10px",
            margin: "0 5px 5px 0",
            fontSize: "13px",
            fontWeight: "400",
            lineHeight: "1.5",
            color: "#212529",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px"
        },
        noneBadge: {
            display: "inline-block",
            padding: "6px 12px",
            fontSize: "13px",
            color: "#6c757d",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px"
        }
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            <div style={styles.container}>

                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>View Letter Details</h2>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>&larr; Back</button>
                </div>

                {/* Row 1: Ref & Date */}
                <div style={{ display: "flex", gap: "40px", marginBottom: "20px" }}>
                    <div style={{ flex: 1, display: "flex" }}>
                        <label style={styles.sectionLabel}>Ref<br />Number</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                value={letter.reference_number || ""}
                                readOnly
                                // Grey applied
                                style={{ ...styles.readOnlyInput, ...styles.readOnlyGrey }}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, display: "flex" }}>
                        <label style={{ ...styles.sectionLabel, width: "100px" }}>Date</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                value={formatDate(letter.created_at)}
                                readOnly
                                // Grey applied
                                style={{ ...styles.readOnlyInput, ...styles.readOnlyGrey }}
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2: Org & Recipient */}
                <div style={{ display: "flex", gap: "40px", marginBottom: "20px" }}>
                    <div style={{ flex: 1, display: "flex" }}>
                        <label style={styles.sectionLabel}>Organization</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                value={letter.organization?.name || ""}
                                readOnly
                                // Grey applied
                                style={{ ...styles.readOnlyInput, ...styles.readOnlyGrey }}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, display: "flex" }}>
                        <label style={{ ...styles.sectionLabel, width: "100px" }}>Recipient</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                value={letter.recipient ? `${letter.recipient.name}, ${letter.recipient.designation}` : ""}
                                readOnly
                                // Grey applied
                                style={{ ...styles.readOnlyInput, ...styles.readOnlyGrey }}
                            />
                        </div>
                    </div>
                </div>

                {/* Row 3: Category */}
                <div style={styles.row}>
                    <label style={styles.sectionLabel}>Category</label>
                    <div style={styles.inputWrapper}>
                        <input
                            type="text"
                            value={letter.category?.name || ""}
                            readOnly
                            // Grey applied
                            style={{ ...styles.readOnlyInput, ...styles.readOnlyGrey }}
                        />
                    </div>
                </div>

                {/* Row 4: Subject */}
                <div style={styles.row}>
                    <label style={styles.sectionLabel}>Subject</label>
                    <div style={{
                        ...styles.inputWrapper,
                        ...styles.htmlBox,
                        ...styles.readOnlyGrey // Grey applied to HTML box
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(letter.subject) }} />
                    </div>
                </div>

                {/* Row 5: Letter Body */}
                <div style={styles.row}>
                    <label style={styles.sectionLabel}>Letter Body</label>
                    <div style={{
                        ...styles.inputWrapper,
                        ...styles.htmlBox,
                        ...styles.readOnlyGrey, // Grey applied to HTML box
                        minHeight: "400px",
                        overflowY: "auto",
                        textAlign: "justify",
                        lineHeight: "1.6"
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(letter.body) }} />
                    </div>
                </div>

                {/* Row 6: Signatory */}
                {/* <div style={styles.row}>
                    <label style={styles.sectionLabel}>Signatory</label>
                    <div style={styles.inputWrapper}>
                        <input
                            type="text"
                            value={getSignatoryDetails()}
                            readOnly
                            style={styles.readOnlyInput}
                        />
                    </div>
                </div> */}

                {/* Divider */}
                <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "30px 0" }} />

                {/* CC Sections */}
                {/* 1. Same Org */}
                <div style={{ ...styles.row, alignItems: "center" }}>
                    <label style={{ ...styles.sectionLabel, width: "250px" }}>Copy Recipients (Same Organization)</label>
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {sameOrgCC.length > 0 ? sameOrgCC.map((cc, i) => (
                            <span key={i} style={styles.chip}>{renderCCItem(cc)}</span>
                        )) : <span style={styles.noneBadge}>None</span>}
                    </div>
                </div>

                {/* 2. Other Org */}
                <div style={{ ...styles.row, alignItems: "center", borderTop: "1px solid #f9f9f9", paddingTop: "15px" }}>
                    <label style={{ ...styles.sectionLabel, width: "250px" }}>Copy Recipients (Other Organization)</label>
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {otherOrgCC.length > 0 ? otherOrgCC.map((cc, i) => (
                            <span key={i} style={styles.chip}>{renderCCItem(cc)}</span>
                        )) : <span style={styles.noneBadge}>None</span>}
                    </div>
                </div>

                {/* 3. My Org */}
                <div style={{ ...styles.row, alignItems: "center", borderTop: "1px solid #f9f9f9", paddingTop: "15px" }}>
                    <label style={{ ...styles.sectionLabel, width: "250px" }}>Copy Recipients (My Organization)</label>
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {myOrgCC.length > 0 ? myOrgCC.map((cc, i) => (
                            <span key={i} style={styles.chip}>{renderCCItem(cc)}</span>
                        )) : <span style={styles.noneBadge}>None</span>}
                    </div>
                </div>

                {/* Divider */}
                <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "30px 0" }} />

                {/* Attachments */}
                <div style={styles.row}>
                    <label style={{ ...styles.sectionLabel, fontWeight: "600", color: "#333" }}>Attachments</label>
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        {letter.attachments && letter.attachments.length > 0 ? (
                            letter.attachments.map((att, idx) => (
                                <a key={idx} href={att.file} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        textDecoration: "none",
                                        backgroundColor: "#f0f8ff",
                                        color: "#007bff",
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        border: "1px solid #cce5ff",
                                        fontSize: "13px",
                                        fontWeight: "500"
                                    }}>
                                    📎 {att.title || "Attachment"}
                                </a>
                            ))
                        ) : (
                            <span style={styles.noneBadge}>None</span>
                        )}
                    </div>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "20px 0" }} />

                {/* References */}
                <div style={{ display: "flex", gap: "40px" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                        <label style={{ ...styles.sectionLabel, width: "180px" }}>Internal Letter References</label>
                        <div style={{ flex: 1 }}>
                            {internalRefs.length > 0 ? (
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {internalRefs.map((ref, idx) => (
                                        <li key={idx} style={{ marginBottom: "5px" }}>
                                            <Link to={`/letters/view/${ref.internal_reference_number.id}`}
                                                style={{ color: "#0096FF", textDecoration: "none", fontWeight: "500" }}>
                                                • {ref.internal_reference_number.reference_number}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : <span style={styles.noneBadge}>None</span>}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                        <label style={{ ...styles.sectionLabel, width: "180px" }}>External Letter References</label>
                        <div style={{ flex: 1 }}>
                            {externalRefs.length > 0 ? (
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {externalRefs.map((ref, idx) => (
                                        <li key={idx} style={{ marginBottom: "5px", color: "#495057" }}>
                                            • {ref.external_reference_number}
                                        </li>
                                    ))}
                                </ul>
                            ) : <span style={styles.noneBadge}>None</span>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}