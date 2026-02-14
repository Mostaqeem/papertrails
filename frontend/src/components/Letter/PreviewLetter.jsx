// PreviewLetter.jsx
import React, { useState, useEffect } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";
import "./PreviewLetter.css";
import DOMPurify from "dompurify";
import axiosInstance from "../../axiosConfig";
import SILLogo from "../../assets/icons/SIL-logo.png";

const renderRichText = (htmlContent) => {
  // Sanitize HTML content
  const clean = DOMPurify.sanitize(htmlContent);

  // Create a temporary div to parse HTML
  const div = document.createElement("div");
  div.innerHTML = clean;

  // Function to process text nodes
  const processNode = (node, parentStyles = {}) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (
        <Text key={Math.random()} style={parentStyles}>
          {node.textContent}
        </Text>
      );
    }

    const children = Array.from(node.childNodes).map((child) =>
      processNode(child, { ...parentStyles })
    );

    // Get current node styles
    let nodeStyles = { ...parentStyles };
    const tagName = node.nodeName.toLowerCase();

    // Map HTML elements to PDF styles
    switch (tagName) {
      case "strong":
      case "b":
        nodeStyles.fontWeight = "bold";
        break;
      case "em":
      case "i":
        nodeStyles.fontStyle = "italic";
        break;
      case "u":
        nodeStyles.textDecoration = "underline";
        break;
      case "s":
      case "strike":
        nodeStyles.textDecoration = "line-through";
        break;
      case "mark":
        nodeStyles.backgroundColor = "yellow"; // Or your preferred highlight color
        break;
      case "p":
        return (
          <Text key={Math.random()} style={{ marginBottom: 10 }}>
            {children}
          </Text>
        );
      case "h1":
        nodeStyles.fontSize = 24;
        nodeStyles.fontWeight = "bold";
        nodeStyles.marginBottom = 10;
        break;
      case "h2":
        nodeStyles.fontSize = 20;
        nodeStyles.fontWeight = "bold";
        nodeStyles.marginBottom = 8;
        break;
      case "h3":
        nodeStyles.fontSize = 18;
        nodeStyles.fontWeight = "bold";
        nodeStyles.marginBottom = 6;
        break;
      case "h4":
        nodeStyles.fontSize = 16;
        nodeStyles.fontWeight = "bold";
        nodeStyles.marginBottom = 6;
        break;
      case "h5":
        nodeStyles.fontSize = 14;
        nodeStyles.fontWeight = "bold";
        nodeStyles.marginBottom = 4;
        break;
      case "h6":
        nodeStyles.fontSize = 12;
        nodeStyles.fontWeight = "bold";
        nodeStyles.marginBottom = 4;
        break;
      case "ul":
        return (
          <View
            key={Math.random()}
            style={{ marginLeft: 20, marginBottom: 10 }}
          >
            {children}
          </View>
        );
      case "ol":
        return (
          <View
            key={Math.random()}
            style={{ marginLeft: 20, marginBottom: 10 }}
          >
            {children}
          </View>
        );
      case "li":
        // Handle both ordered and unordered lists
        const isOrdered = node.parentNode.nodeName.toLowerCase() === "ol";
        const listMarker = isOrdered
          ? `${Array.from(node.parentNode.children).indexOf(node) + 1}. `
          : "• ";
        return (
          <View
            key={Math.random()}
            style={{ flexDirection: "row", marginBottom: 5 }}
          >
            <Text style={nodeStyles}>{listMarker}</Text>
            <View style={{ flex: 1 }}>{children}</View>
          </View>
        );
      case "blockquote":
        nodeStyles.marginLeft = 20;
        nodeStyles.marginRight = 20;
        nodeStyles.marginTop = 10;
        nodeStyles.marginBottom = 10;
        nodeStyles.paddingLeft = 10;
        nodeStyles.borderLeftWidth = 3;
        nodeStyles.borderLeftColor = "#ccc";
        nodeStyles.borderLeftStyle = "solid";
        break;
      case "code":
        nodeStyles.fontFamily = "Courier";
        nodeStyles.backgroundColor = "#f5f5f5";
        nodeStyles.padding = 2;
        break;
      case "div":
        // Handle alignment for divs
        const align = node.style.textAlign;
        if (align) {
          nodeStyles.textAlign = align;
        }
        break;
      case "span":
        // Handle inline styles for spans (color, background, font family, etc.)
        const style = node.style;

        // Color
        if (style.color) {
          nodeStyles.color = style.color;
        }

        // Background color
        if (style.backgroundColor) {
          nodeStyles.backgroundColor = style.backgroundColor;
        }

        // Font family
        if (style.fontFamily) {
          nodeStyles.fontFamily = style.fontFamily;
        }

        // Font size
        if (style.fontSize) {
          nodeStyles.fontSize = parseInt(style.fontSize);
        }

        // Text alignment
        if (style.textAlign) {
          nodeStyles.textAlign = style.textAlign;
        }
        break;
      case "sub":
        nodeStyles.fontSize = 8;
        nodeStyles.textRise = -5;
        break;
      case "sup":
        nodeStyles.fontSize = 8;
        nodeStyles.textRise = 5;
        break;
      default:
        // For unknown tags, just return children without additional styling
        return children;
    }

    // Apply styles to text content
    if (
      [
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "span",
        "sub",
        "sup",
        "code",
      ].includes(tagName)
    ) {
      return (
        <Text key={Math.random()} style={nodeStyles}>
          {children}
        </Text>
      );
    }

    return children;
  };

  const processedContent = processNode(div);
  return processedContent;
};

// Create styles for React-pdf
Font.register({
  family: "Calibri",
  fonts: [
    {
      src: "/path/to/calibri-regular.ttf", // or URL to font file
    },
    {
      src: "/path/to/calibri-bold.ttf",
      fontWeight: "bold",
    },
    {
      src: "/path/to/calibri-italic.ttf",
      fontWeight: "normal",
      fontStyle: "italic",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 60,
    paddingBottom: 50,
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    position: "absolute",
    top: 10,
    left: 143,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    backgroundColor: "white",
  },
  headerLogo: {
    width: 150,
    height: 50,
    objectFit: "contain",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  date: {
    fontSize: 11,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    marginBottom: 20,
  },
  metadata: {
    marginBottom: 30,
  },
  recipient: {
    marginBottom: 20,
    lineHeight: 1.8,
  },
  recipientBlock: {
    marginBottom: 20,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  recipientText: {
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 1,
    color: "#000000",
  },

  // --- UPDATED STYLES FOR ORGANIZATION & ADDRESS ---
  companyName: {
    fontSize: 12,
    marginBottom: 0, // Ensure no space below the name
    lineHeight: 1,
    color: "#000000",
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 1,
    marginTop: 2, // NEGATIVE MARGIN: Pulls the address up
    marginBottom: 2,
    color: "#000000",
  },
  // ------------------------------------------------

  subject: {
    marginBottom: 20,
  },
  bodyWithSignature: {
    marginBottom: 0,
    textAlign: "justify",
  },
  bodyWithoutSignature: {
    marginBottom: 20,
    textAlign: "justify",
  },
  closing: {
    marginTop: 0,
    marginBottom: 0,
  },
  signature: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  signatoryName: {
    fontWeight: "bold",
    marginTop: 0, // CHANGED: Removed the large top margin
    marginBottom: 4, // Small gap between name and designation
  },
  signatureImage: {
    width: 150, // Adjust width as needed
    height: 60, // Adjust height as needed
    objectFit: "contain",
    objectPosition: "left",
    marginBottom: 5, // Space between image and name
    marginTop: 0,
    left: 0,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 40,
    right: 30,
    fontSize: 8,
    lineHeight: 1.2,
    color: "#000",
    backgroundColor: "white",
    fontFamily: "Helvetica",
    textAlign: "center",
  },
  footerNote: {
    fontStyle: "italic",
    marginBottom: 20,
  },
  footerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    marginBottom: 10,
  },
  // --- NEW STYLES FOR ATTACHMENT SECTION ---
  attachmentSection: {
    marginTop: 10, // Space above the section
    marginBottom: 5,
    fontSize: 11,
  },
  attachmentTitle: {
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 5,
  },
  attachmentItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 10, // Indent for alignment
  },
  attachmentLabel: {
    width: 20, // Space for "a)", "b)"
  },
  attachmentText: {
    flex: 1,
  },
  // --- NEW STYLES FOR C.C. SECTION ---
  ccSection: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 11,
  },
  ccTitle: {
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 5,
  },
  ccItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 10, // Indent the list slightly
  },
  ccLabel: {
    width: 20, // Width for "a)", "b)"
  },
  ccText: {
    flex: 1,
  },
});

// Header Component
const DocumentHeader = () => (
  <View style={styles.header} fixed>
    <View style={{ flex: 1 }}></View>
    <Image style={styles.headerLogo} src={SILLogo} />
  </View>
);

// Footer Component
const DocumentFooter = () => (
  <View style={styles.footer} fixed>
    <Text>
      <Text style={{ fontWeight: "bold" }}>
        A Sonali Intellect Joint Venture
      </Text>
      {"\n"}
      Sonali Intellect Limited, Level 7, Abedin Tower, 35, Kemal Ataturk Avenue,
      Banani C/A, Dhaka-1213, Bangladesh.
      {"\n"}
      Phone: +880 96 6691 0800, URL: www.sonaliintellect.com
    </Text>
  </View>
);

// PDF Document Component
const LetterPDF = ({ formData, tentativeRefNumber }) => {
  // ⬅️ UPDATED: Accept tentativeRefNumber
  // Determine body style based on useDigitalSignature
  const bodyStyle = formData.useDigitalSignature
    ? styles.bodyWithSignature
    : styles.bodyWithoutSignature;

  // Helper to format the C.C. text
  const formatCCDetails = (recipient) => {
    if (recipient.details) {
      const { short_designation, department, short_organization } =
        recipient.details;
      const parts = [short_designation, department, short_organization].filter(
        (part) => part && part.trim() !== ""
      );
      if (parts.length > 0) return parts.join(", ");
    }
    return recipient.name;
  };

  // Combine all CC lists
  const allCCRecipients = [
    ...(formData.copySameOrgRecipients || []),
    ...(formData.copyOtherOrgRecipients || []),
    ...(formData.copyMyOrgRecipients || []),
  ];

  // Filter attachments to ensure we only print valid ones (optional safeguard)
  const validAttachments = (formData.attachments || []).filter(
    (att) => att.title || att.file
  );

  const displayRefNumber =
    formData.refNumber || tentativeRefNumber || "Generating Reference...";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {formData.useDigitalLetterhead && <DocumentHeader />}

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.top}>
            <Text>Reference: {displayRefNumber}</Text>
            <Text style={styles.date}>
              {" "}
              {formData.date
                ? new Date(formData.date)
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .replace(/(\d+)\s+(\w+)\s+(\d+)/, "$1 $2, $3")
                : ""}
            </Text>
          </View>
        </View>

        {/* Recipient & Organization Section */}
        <View style={styles.recipientBlock}>
          {formData.useRecipientName ? (
            <>
              <Text style={styles.recipientText}>
                {formData.recipientDetails?.name || ""}
              </Text>
              <Text style={styles.recipientText}>
                {formData.recipientDetails?.designation || ""}
              </Text>
            </>
          ) : (
            <Text style={styles.recipientText}>
              The {formData.recipientDetails?.designation || ""}
            </Text>
          )}

          <Text style={styles.companyName}>
            {formData.organizationDetails?.name || ""}
          </Text>

          {formData.printAddressTags &&
            formData.organizationDetails?.address && (
              <Text style={styles.addressText}>
                {formData.organizationDetails.address}
              </Text>
            )}
        </View>

        {/* Subject */}
        <View style={styles.subject}>
          <Text style={{ fontWeight: "bold" }}>
            Subject: {renderRichText(formData.subject || "")}
          </Text>
        </View>

        {/* Body */}
        <View style={bodyStyle}>{renderRichText(formData.body || "")}</View>

        {/* Closing Section (Signature) */}
        <View style={styles.closing}>
          <View style={styles.signature}>
            {/* 1. Digital Signature Image */}
            {formData.useDigitalSignature &&
            formData.signatoryDetails?.digital_signature_url ? (
              <Image
                src={formData.signatoryDetails.digital_signature_url}
                style={styles.signatureImage}
              />
            ) : null}

            {/* 2. Signatory Name */}
            <Text style={styles.signatoryName}>
              {formData.signatoryDetails?.full_name || "Signatory Name"}
            </Text>

            {/* 3. Signatory Designation */}
            <Text>
              {formData.signatoryDetails?.designation || "Designation"}
            </Text>
          </View>
        </View>

        {/* --- ATTACHMENT SECTION --- */}
        {/* Render only if there are valid attachments */}
        {validAttachments.length > 0 && (
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentTitle}>Attachment:</Text>
            {validAttachments.map((att, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Text style={styles.attachmentLabel}>
                  {String.fromCharCode(97 + index)})
                </Text>
                <Text style={styles.attachmentText}>
                  {att.title || att.file?.name || "Untitled Attachment"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* --- C.C. SECTION --- */}
        {formData.useCCName && allCCRecipients.length > 0 && (
          <View style={styles.ccSection}>
            <Text style={styles.ccTitle}>C.C. to:</Text>
            {allCCRecipients.map((recipient, index) => (
              <View key={index} style={styles.ccItem}>
                <Text style={styles.ccLabel}>
                  {String.fromCharCode(97 + index)})
                </Text>
                <Text style={styles.ccText}>{formatCCDetails(recipient)}</Text>
              </View>
            ))}
          </View>
        )}

        {formData.useDigitalLetterhead && <DocumentFooter />}
      </Page>
    </Document>
  );
};

const PreviewLetter = ({ formData, isOpen, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // ⬅️ NEW STATE: To hold the fetched tentative reference number
  const [tentativeRefNumber, setTentativeRefNumber] = useState(null);

  // ⬅️ NEW useEffect hook to fetch the tentative reference number
  useEffect(() => {
    if (!isOpen) {
      setTentativeRefNumber(null); // Clear on close
      return;
    }

    const { organization, recipient, category } = formData;

    // Check if all required IDs are present
    if (organization && recipient && category) {
      const fetchRefNumber = async () => {
        setTentativeRefNumber("Loading...");
        try {
          const response = await axiosInstance.get("letters/next-reference/", {
            params: {
              organization_id: organization,
              recipient_id: recipient,
              category_id: category,
              date: formData.date,
            },
          });
          setTentativeRefNumber(response.data.tentative_reference_number);
        } catch (err) {
          console.error("Error fetching tentative reference number:", err);
          // Set to a helpful error message or keep null
          setTentativeRefNumber("Error fetching reference");
        }
      };

      fetchRefNumber();
    } else {
      // If IDs are missing (e.g., initial form state), set a placeholder
      setTentativeRefNumber("Select required fields");
    }
  }, [
    isOpen,
    formData.organization,
    formData.recipient,
    formData.category,
    formData.date,
  ]); // ⬅️ Dependencies

  const saveLetter = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Helper function to convert date to ISO 8601 datetime format
      const formatDateToISO = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        // Return ISO string with time set to midnight UTC
        return date.toISOString();
      };

      const pdfBlob = await pdf(
        <LetterPDF
          formData={formData}
          tentativeRefNumber={tentativeRefNumber}
        />
      ).toBlob();

      // 2. **Convert the Blob to a File object**
      const pdfFileName = `letter-${
        formData.refNumber || tentativeRefNumber || "document"
      }.pdf`;

      // This creates a file-like object on the client side
      const pdfFile = new File([pdfBlob], pdfFileName, {
        type: "application/pdf",
      });

      // Prepare form data for submission
      const letterPayload = new FormData();

      // Add text fields
      letterPayload.append("subject", formData.subject);
      letterPayload.append("body", formData.body);
      letterPayload.append("organization", formData.organization);
      letterPayload.append("recipient", formData.recipient);
      letterPayload.append("category", formData.category);
      letterPayload.append("signatory", formData.signatory);
      letterPayload.append("date", formatDateToISO(formData.date));
      letterPayload.append(
        "use_recipient_name",
        formData.useRecipientName || false
      );
      letterPayload.append("use_cc_name", formData.useCCName || false);
      letterPayload.append(
        "use_digital_signature",
        formData.useDigitalSignature || false
      );
      letterPayload.append(
        "use_digital_letterhead",
        formData.useDigitalLetterhead
      );
      letterPayload.append(
        "print_address_tags",
        formData.printAddressTags || false
      );

      // Add CC recipients
      formData.copySameOrgRecipients.forEach((recipient) => {
        letterPayload.append("copySameOrg", recipient.name);
      });
      formData.copyOtherOrgRecipients.forEach((recipient) => {
        letterPayload.append("copyOtherOrg", recipient.name);
      });
      formData.copyMyOrgRecipients.forEach((recipient) => {
        letterPayload.append("copyMyOrg", recipient.name);
      });

      // Add multiple attachments
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((attachment, index) => {
          if (attachment.file) {
            letterPayload.append("attachments", attachment.file);
            letterPayload.append("attachmentTitles", attachment.title || "");
          }
        });
      }

      // Add internal references (list of letter IDs)
      if (formData.internalRefs && formData.internalRefs.length > 0) {
        formData.internalRefs.forEach((ref) => {
          // The backend expects the reference_number string to perform the lookup
          if (ref.reference_number) {
            letterPayload.append("internalReferences", ref.reference_number);
          }
        });
      }

      // Add external references
      if (formData.externalRef && formData.externalRef.trim()) {
        const externalRefs = formData.externalRef
          .split(",")
          .map((ref) => ref.trim())
          .filter((ref) => ref);
        externalRefs.forEach((ref) => {
          letterPayload.append("externalReferences", ref);
        });
      }

      // Send POST request to backend API
      const response = await axiosInstance.post(
        "letters/create/",
        letterPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newLetterId = response.data.id; // Get the ID of the newly created Letter

      // 5. **Save the PDF File** (Step 2: Save generated PDF to LetterFile model)
      const pdfPayload = new FormData();
      pdfPayload.append("letter", newLetterId);
      pdfPayload.append("document", pdfFile); // Use the converted PDF file

      await axiosInstance.post(
        "letters/letter_file/", // The ListCreateAPIView endpoint
        pdfPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(
        `Letter created successfully! Reference Number: ${response.data.reference_number}`
      );
      console.log("Letter Submitted:", response.data);

      // Close preview after successful save
      setTimeout(() => {
        onClose();
        window.location.href = "/letters"; // Redirect to letters list
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Error saving letter:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to save letter. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    try {
      // ⬅️ UPDATED: Pass the tentativeRefNumber to LetterPDF for download
      const blob = await pdf(
        <LetterPDF
          formData={formData}
          tentativeRefNumber={tentativeRefNumber}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Use the tentativeRefNumber for the filename if refNumber is not set
      link.download = `letter-${
        formData.refNumber || tentativeRefNumber || "document"
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-header">
          <h2>Letter Preview</h2>
          <div className="preview-controls">
            <button onClick={downloadPDF} className="download-btn">
              Download PDF
            </button>
            <button
              onClick={saveLetter}
              disabled={saving}
              className="save-btn"
              style={{
                opacity: saving ? 0.6 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Letter"}
            </button>
            <button onClick={onClose} className="cancel-btn">
              Back
            </button>
          </div>
        </div>

        {/* Success and Error Messages */}
        {success && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              marginLeft: "16px",
              marginRight: "16px",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "4px",
              border: "1px solid #c3e6cb",
            }}
          >
            ✓ {success}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              marginLeft: "16px",
              marginRight: "16px",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
              border: "1px solid #f5c6cb",
            }}
          >
            ✕ {error}
          </div>
        )}

        <div className="preview-content">
          <PDFViewer style={{ width: "100%", height: "100%" }}>
            <LetterPDF
              formData={formData}
              tentativeRefNumber={tentativeRefNumber}
            />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default PreviewLetter;
