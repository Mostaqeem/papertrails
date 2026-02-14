// LetterForm.jsx
import React, { useState, useMemo, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./LetterForm.css";
import PreviewLetter from "./PreviewLetter";
import axiosInstance from "../../axiosConfig";
import LLMAxiosInstance from "../../axiosLLMConfig";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import trashIcon from "../../assets/icons/trash.svg";
export default function LetterForm() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // State for dropdown data from database
  const [organizations, setOrganizations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [signatories, setSignatories] = useState([]);
  const [internalReferences, setInternalReferences] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [myorgrecipient, setMyOrgRecipient] = useState([]);
  const [sameorgrecipient, setSameOrgRecipient] = useState([]);
  const [otherorgrecipient, setOtherOrgRecipient] = useState([]);
  const [filteredSameOrgRecipients, setFilteredSameOrgRecipients] = useState(
    []
  );

  const [filteredOtherOrgRecipients, setFilteredOtherOrgRecipients] = useState(
    []
  );

  const [internalRefSuggestions, setInternalRefSuggestions] = useState([]);
  const [showInternalRefSuggestions, setShowInternalRefSuggestions] =
    useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // State for CC suggestions
  const [ccSuggestions, setCcSuggestions] = useState({
    copySameOrg: [],
    copyOtherOrg: [],
    copyMyOrg: [],
  });
  const [showSuggestions, setShowSuggestions] = useState({
    copySameOrg: false,
    copyOtherOrg: false,
    copyMyOrg: false,
  });

  const [LLMResponse, setLLMResponse] = useState("");

  const [formData, setFormData] = useState({
    refNumber: "",
    organization: "",
    organizationDetails: null, // Store full organization object
    recipient: "",
    recipientDetails: null, // Store full recipient object
    category: "",
    date: "",
    subject: "",
    body: "",
    signatory: "",
    signatoryDetails: null,
    attachments: [],
    internalRef: "",
    externalRef: "",
    useRecipientName: true,
    useCCName: true,
    useDigitalSignature: true,
    useDigitalLetterhead: true,
    printAddressTags: true,
    copySameOrg: "",
    copyOtherOrg: "",
    copyMyOrg: "",
    // Add arrays to store multiple CC recipients
    copySameOrgRecipients: [],
    copyOtherOrgRecipients: [],
    copyMyOrgRecipients: [],
    internalRefs: [],
  });

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [
          orgsRes,
          recipientsRes,
          categoriesRes,
          signatoriesRes,
          ccMyOrgRes,
          ccSameOrgRes,
          ccOtherOrgRes,
          internalRefsRes,
        ] = await Promise.all([
          axiosInstance.get("letters/organizations/"),
          axiosInstance.get("letters/recipients/"),
          axiosInstance.get("letters/categories/"),
          axiosInstance.get("accounts/signatories/"),
          axiosInstance.get("accounts/my_org_cc/"),
          axiosInstance.get("letters/cc/same-organization/"),
          axiosInstance.get("letters/cc/other-organization/"),
          axiosInstance.get("letters/"),
        ]);

        // Handle paginated responses - check for results property or use data directly
        const orgsData = orgsRes.data.results || orgsRes.data;
        const recipientsData = recipientsRes.data.results || recipientsRes.data;
        const categoriesData = categoriesRes.data.results || categoriesRes.data;
        const signatoriesData =
          signatoriesRes.data.results || signatoriesRes.data;
        const myOrgData = ccMyOrgRes.data.results || ccMyOrgRes.data;
        const sameOrgData = ccSameOrgRes.data.results || ccSameOrgRes.data;
        const otherOrgData = ccOtherOrgRes.data.results || ccOtherOrgRes.data;
        const internalRefsData =
          internalRefsRes.data.results || internalRefsRes.data;

        // Safely set data with fallback to empty arrays
        setOrganizations(Array.isArray(orgsData) ? orgsData : []);
        setRecipients(Array.isArray(recipientsData) ? recipientsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setSignatories(Array.isArray(signatoriesData) ? signatoriesData : []);
        setMyOrgRecipient(Array.isArray(myOrgData) ? myOrgData : []);
        setSameOrgRecipient(Array.isArray(sameOrgData) ? sameOrgData : []);
        setOtherOrgRecipient(Array.isArray(otherOrgData) ? otherOrgData : []);
        setInternalReferences(
          Array.isArray(internalRefsData) ? internalRefsData : []
        );
        setFilteredSameOrgRecipients(
          Array.isArray(sameOrgData) ? sameOrgData : []
        );
        setFilteredOtherOrgRecipients(
          Array.isArray(otherOrgData) ? otherOrgData : []
        );

        // Log the actual response structure to debug
        console.log("API Responses:", {
          organizations: orgsData,
          recipients: recipientsData,
          categories: categoriesData,
          signatories: signatoriesData,
          myorgrecipient: myOrgData,
          sameorgrecipient: sameOrgData,
          otherorgrecipient: otherOrgData,
          internalReferences: internalRefsData,
        });
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDropdownData();
  }, []);

  // New useEffect to filter same org recipients when organization changes
  useEffect(() => {
    if (formData.organization && formData.organizationDetails) {
      const selectedOrgId = formData.organizationDetails.id;
      const selectedOrgName = formData.organizationDetails.name;
      const selectedOrgShort =
        formData.organizationDetails.short_name ||
        formData.organizationDetails.abbreviation ||
        formData.organizationDetails.short_form;

      console.log("=== FILTERING SAME ORG RECIPIENTS ===");
      console.log("Selected Org ID:", selectedOrgId, typeof selectedOrgId);
      console.log("Selected Org Name:", selectedOrgName);
      console.log("Selected Org Short:", selectedOrgShort);
      console.log("Total recipients to filter:", sameorgrecipient.length);
      console.log("Sample recipient:", sameorgrecipient[0]);

      // First filter sameorgrecipient based on the selected organization
      const filtered = sameorgrecipient.filter((recipient) => {
        // Check if recipient's short_organization matches the selected org's short form
        const orgShortMatch =
          selectedOrgShort && recipient.short_organization === selectedOrgShort;

        // Log matching results for all recipients
        console.log("Recipient:", recipient.name, "| Match:", orgShortMatch, {
          selectedOrgShort,
          recipientShortOrg: recipient.short_organization,
        });

        return orgShortMatch;
      });

      console.log("Filtered results:", filtered.length, "recipients");
      setFilteredSameOrgRecipients(filtered);
    } else {
      // If no organization selected, show all same org recipients
      console.log("No organization selected, showing all recipients");
      setFilteredSameOrgRecipients(sameorgrecipient);
    }
  }, [formData.organization, formData.organizationDetails, sameorgrecipient]);

  // UseEffect to filter other org recipients when organization changes
  useEffect(() => {
    if (formData.organization && formData.organizationDetails) {
      const selectedOrgShort =
        formData.organizationDetails.short_name ||
        formData.organizationDetails.abbreviation ||
        formData.organizationDetails.short_form;

      console.log("=== FILTERING OTHER ORG RECIPIENTS ===");

      // Filter otherorgrecipient to exclude the selected organization
      const filtered = otherorgrecipient.filter((recipient) => {
        const isSameOrg =
          selectedOrgShort && recipient.short_organization === selectedOrgShort;
        return !isSameOrg; // Return recipients that are NOT from the same organization
      });

      console.log("Filtered other org results:", filtered.length, "recipients");
      setFilteredOtherOrgRecipients(filtered);
    } else {
      setFilteredOtherOrgRecipients(otherorgrecipient);
    }
  }, [formData.organization, formData.organizationDetails, otherorgrecipient]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "organization") {
      const selectedOrg = organizations.find(
        (org) => org.id.toString() === value
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        organizationDetails: selectedOrg || null,
        copySameOrgRecipients: [],
      }));
    } else if (name === "recipient") {
      const selectedRecipient = recipients.find(
        (rec) => rec.id.toString() === value
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        recipientDetails: selectedRecipient || null,
      }));
    } else if (name === "signatory") {
      // [NEW] Capture full signatory details including signature URL
      const selectedSignatory = signatories.find(
        (sig) => sig.id.toString() === value
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        signatoryDetails: selectedSignatory || null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCcChange = (e) => {
    const { name, value } = e.target;

    // Update the form data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Show suggestions when user starts typing
    if (value.length > 0) {
      setShowSuggestions((prev) => ({ ...prev, [name]: true }));

      // Filter suggestions based on the field type
      let suggestions = [];
      switch (name) {
        case "copySameOrg":
          suggestions = filteredSameOrgRecipients.filter((recipient) =>
            recipient.name.toLowerCase().includes(value.toLowerCase())
          );
          break;
        case "copyOtherOrg":
          suggestions = filteredOtherOrgRecipients.filter((recipient) =>
            recipient.name.toLowerCase().includes(value.toLowerCase())
          );
          break;
        case "copyMyOrg":
          suggestions = myorgrecipient.filter((copyMyOrg) =>
            copyMyOrg.full_name.toLowerCase().includes(value.toLowerCase())
          );
          break;
        default:
          suggestions = [];
      }

      setCcSuggestions((prev) => ({ ...prev, [name]: suggestions }));
    } else {
      setShowSuggestions((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSuggestionSelect = (fieldName, recipient) => {
    // Determine which field to use based on the field name
    let displayName = "";
    switch (fieldName) {
      case "copyMyOrg":
        displayName = recipient.full_name; // Use full_name for my org
        break;
      case "copySameOrg":
      case "copyOtherOrg":
      default:
        displayName = recipient.name; // Use name for other orgs
        break;
    }

    // Add directly to recipients array
    const newRecipient = {
      id: recipient.id,
      name: displayName,
      details: recipient, // Store full recipient object for later use
    };

    setFormData((prev) => {
      const recipientsField = `${fieldName}Recipients`;
      return {
        ...prev,
        [recipientsField]: [...prev[recipientsField], newRecipient],
        [fieldName]: "", // Clear the input field
      };
    });

    setShowSuggestions((prev) => ({ ...prev, [fieldName]: false }));
  };

  const handleAddCcRecipient = (fieldName) => {
    const currentValue = formData[fieldName];
    if (currentValue && currentValue.trim()) {
      const newRecipient = {
        id: Date.now(), // temporary ID
        name: currentValue.trim(),
      };

      setFormData((prev) => {
        const recipientsField = `${fieldName}Recipients`;
        return {
          ...prev,
          [recipientsField]: [...prev[recipientsField], newRecipient],
          [fieldName]: "", // Clear the input field
        };
      });

      // Hide suggestions
      setShowSuggestions((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleRemoveRecipient = (fieldName, index) => {
    setFormData((prev) => {
      const recipientsField = `${fieldName}Recipients`;
      return {
        ...prev,
        [recipientsField]: prev[recipientsField].filter((_, i) => i !== index),
      };
    });
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => {
        const updatedAttachments = [...prev.attachments];
        if (!updatedAttachments[index]) {
          updatedAttachments[index] = {};
        }
        updatedAttachments[index].file = file;
        return { ...prev, attachments: updatedAttachments };
      });
    }
  };

  const handleAttachmentTitleChange = (e, index) => {
    const { value } = e.target;
    setFormData((prev) => {
      const updatedAttachments = [...prev.attachments];
      if (!updatedAttachments[index]) {
        updatedAttachments[index] = {};
      }
      updatedAttachments[index].title = value;
      return { ...prev, attachments: updatedAttachments };
    });
  };

  const handleAddAttachment = () => {
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { title: "", file: null }],
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Just open the preview modal without saving
    setIsPreviewOpen(true);
  };

  const handleBodyChange = (value) => {
    setFormData((prev) => ({ ...prev, body: value }));
  };

  const handleSubjectChange = (value) => {
    setFormData((prev) => ({ ...prev, subject: value }));
  };

  //Handler for internal reference input change

  const handleInternalRefChange = (e) => {
    const { value } = e.target;

    // Update the form data - keep internalRef as input field value
    setFormData((prev) => ({ ...prev, internalRef: value }));

    // Show suggestions when user starts typing
    if (value.length > 0) {
      setShowInternalRefSuggestions(true);

      // Filter internal references based on what user typed
      const suggestions = internalReferences.filter((ref) => {
        const refNumber = ref.reference_number || "";
        const subject = ref.subject || "";
        return (
          refNumber.toLowerCase().includes(value.toLowerCase()) ||
          subject.toLowerCase().includes(value.toLowerCase())
        );
      });

      setInternalRefSuggestions(suggestions);
    } else {
      setShowInternalRefSuggestions(false);
    }
  };

  // Handler when user clicks a suggestion
  const handleInternalRefSelect = (selectedRef) => {
    // Add to internalRefs array if not already added
    const alreadyAdded = formData.internalRefs.some(
      (ref) => ref.id === selectedRef.id
    );

    if (!alreadyAdded) {
      setFormData((prev) => ({
        ...prev,
        internalRefs: [...prev.internalRefs, selectedRef],
        internalRef: "", // Clear input field
      }));
    }

    setShowInternalRefSuggestions(false);
    setInternalRefSuggestions([]);
  };

  // Handler to add custom reference from input
  const handleAddCustomInternalRef = () => {
    const customRef = formData.internalRef.trim();
    if (customRef) {
      // Add as a custom reference object
      const newRef = {
        id: Date.now(), // Temporary ID
        reference_number: customRef,
        subject: "Custom reference",
      };

      setFormData((prev) => ({
        ...prev,
        internalRefs: [...prev.internalRefs, newRef],
        internalRef: "",
      }));
    }
    setShowInternalRefSuggestions(false);
    setInternalRefSuggestions([]);
  };

  // Handler to remove a reference
  const handleRemoveInternalRef = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      internalRefs: prev.internalRefs.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const handleInternalRefBlur = () => {
    setTimeout(() => {
      setShowInternalRefSuggestions(false);
    }, 200);
  };

  const handleOpenAiModal = (e) => {
    e.preventDefault(); // Prevent form submission
    setIsAiModalOpen(true);
  };

  //Handling formatting for preview
  const previewFormattedText = (text) => {
    // Simple markdown to HTML converter
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>")
      .replace(
        /^\s*\[(.*?)\]\s*$/gm,
        '<div style="margin: 5px 0; padding: 5px; background: #f0f0f0;">[$1]</div>'
      )
      .replace(
        /---/g,
        '<hr style="border-top: 1px solid #ccc; margin: 20px 0;" />'
      );
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    try {
      // fastapi url endpoint

      const response = await LLMAxiosInstance.post("/generate", {
        prompt: `
        Act as an employee of Sonali Intellect Limited (SIL). Compose ONLY the body paragraph(s) of a formal business letter concerning: ${aiPrompt.trim()}.

        Exclude all letter formatting: no header, no salutation, no closing signature block, no date, and no meta-commentary like word count or IELTS score.

        Requirements:
        - atleast 320 words.
        - Respectful, professional tone.
        - IELTS Band 8 writing standard.`,
      });

      // const response = await LLMAxiosInstance.post("/generate", {
      //   prompt: `
      //   You are to generate a formal business letter on behalf of Sonali Intellect Limited (SIL).
      //   IMPORTANT: Return the response in HTML format with proper paragraph tags.
      //   Formatting requirements:
      //   1. Use <p> tags for paragraphs
      //   2. Use <strong> for bold text (not **)
      //   3. Use <br/> for line breaks within paragraphs
      //   4. Use <h3> for section headers
      //   5. Use <hr/> for horizontal rules
      //   6. Use inline styles for proper letter formatting

      //   Letter topic: ${aiPrompt.trim()}

      //   Return only the HTML content, no markdown.
      // `,
      // });

      console.log("AI Generation response:", response);

      const generatedText = previewFormattedText(response.data.result);

      // Append or Replace logic
      setFormData((prev) => ({
        ...prev,
        // This appends to existing body. Remove `prev.body +` if you want to overwrite.
        body: prev.body ? prev.body + `<br/>${generatedText}` : generatedText,
      }));

      setIsAiModalOpen(false);
      setAiPrompt("");
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Failed to generate text. Please try again.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // This component renders the dropdown for internal reference suggestions
  const InternalRefSuggestionDropdown = ({
    suggestions,
    isVisible,
    onSelect,
  }) => {
    if (!isVisible || !suggestions.length) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 1000,
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        {suggestions.map((ref, index) => (
          <div
            key={ref.id || index}
            onClick={() => onSelect(ref)}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              borderBottom: "1px solid #f0f0f0",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "white";
            }}
          >
            <div style={{ fontWeight: "500" }}>
              {ref.reference_number || ref.subject}
            </div>
            {ref.subject && ref.reference_number && (
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
              >
                {ref.subject}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // AddedRecipientsDisplay Component
  const AddedRecipientsDisplay = ({ recipients, fieldName, onRemove }) => {
    if (!recipients || recipients.length === 0) return null;

    return (
      <div
        style={{
          marginTop: "8px",
          padding: "8px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#6c757d",
            marginBottom: "4px",
            fontWeight: "500",
          }}
        >
          Added{" "}
          {fieldName === "copyMyOrg"
            ? "My Org"
            : fieldName === "copySameOrg"
            ? "Same Org"
            : "Other Org"}{" "}
          Recipients:
        </div>
        {recipients.map((recipient, index) => (
          <div
            key={recipient.id || index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 8px",
              marginBottom: "2px",
              backgroundColor: "white",
              borderRadius: "3px",
              border: "1px solid #dee2e6",
            }}
          >
            <span style={{ fontSize: "13px" }}>{recipient.name}</span>
            <button
              type="button"
              onClick={() => onRemove(fieldName, index)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
              }}
              title="Remove recipient"
            >
              <img
                src={trashIcon}
                alt="Remove"
                style={{
                  width: "18px",
                  height: "18px",
                  opacity: "0.6",
                }}
              />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const AddedInternalRefsDisplay = ({ references, onRemove }) => {
    if (!references || references.length === 0) return null;

    return (
      <div
        style={{
          marginTop: "8px",
          padding: "8px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#6c757d",
            marginBottom: "4px",
            fontWeight: "500",
          }}
        >
          Added Internal References:
        </div>
        {references.map((ref, index) => (
          <div
            key={ref.id || index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 8px",
              marginBottom: "2px",
              backgroundColor: "white",
              borderRadius: "3px",
              border: "1px solid #dee2e6",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500" }}>
                {ref.reference_number || ref.subject}
              </div>
              {ref.subject && ref.subject !== "Custom reference" && (
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {ref.subject}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
              }}
              title="Remove reference"
            >
              <img
                src={trashIcon}
                alt="Remove"
                style={{
                  width: "18px",
                  height: "18px",
                  opacity: "0.6",
                }}
              />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // SuggestionDropdown Component
  const SuggestionDropdown = ({
    suggestions,
    isVisible,
    onSelect,
    fieldName,
  }) => {
    if (!isVisible || !suggestions.length) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 1000,
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        {suggestions.map((recipient, index) => (
          <div
            key={recipient.id || index}
            onClick={() => onSelect(fieldName, recipient)}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              borderBottom: "1px solid #f0f0f0",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "white";
            }}
          >
            {/* Main name */}
            <div style={{ fontWeight: "500" }}>
              {fieldName === "copyMyOrg" ? recipient.full_name : recipient.name}
            </div>

            {/* Additional details in smaller font */}
            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
              {[
                recipient.short_designation,
                recipient.department,
                recipient.short_organization,
              ]
                .filter(Boolean) // Remove empty/null values
                .join(", ")}
            </div>

            {/* Email if available */}
            {recipient.email && (
              <div
                style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}
              >
                {recipient.email}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ReactQuill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ script: "sub" }, { script: "super" }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          ["blockquote", "code-block"],
          ["link", "image", "video"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ];

  // Simple subject editor modules (limited toolbar)
  const subjectModules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["clean"],
      ],
    }),
    []
  );

  const subjectFormats = [
    "bold",
    "italic",
    "underline",
    "color",
    "background",
    "align",
  ];

  // Loading state check - show loading message while data is being fetched
  if (loadingData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading form data...
      </div>
    );
  }

  return (
    <form
      className="letter-form"
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "3fr 1fr",
        gap: "24px",
        padding: "0px",
      }}
    >
      {/* Main Form Content */}
      <div>
        <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>New Letter</h2>

        {/* --- 1. TOP 3-COLUMN GRID (Ref, Org, Recipient) --- */}
        <div className="form-grid-layout">
          <div>
            <label>Ref Number</label>
            <input
              className="ref-input"
              type="text"
              name="refNumber"
              value="SIL/XXX/CAT/YYYY/XXX"
              disabled
              onChange={handleChange}
              placeholder="Enter Ref Number"
              readOnly
              style={{ backgroundColor: "#E2E2E2" }}
            />
          </div>
          <div>
            <label>Organization</label>
            <select
              name="organization"
              value={formData.organization}
              onChange={handleChange}
            >
              <option value="">-- Select --</option>
              {Array.isArray(organizations) &&
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label>Recipient</label>
            <select
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
            >
              <option value="">-- Select --</option>
              {filteredSameOrgRecipients.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.name}, {rec.short_designation}
                </option>
              ))}
            </select>
          </div>
          {/* Second Row of Top Grid (Category, Date) */}
          <div>
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">-- Select --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Date</label>
            <DatePicker
              selected={formData.date ? new Date(formData.date) : null}
              onChange={(date) => setFormData({ ...formData, date: date })}
              dateFormat="dd MMM yyyy"
              placeholderText="02 Mar 2025"
              className="form-control"
              wrapperClassName="date-picker-wrapper"
              customInput={<input />}
            />
          </div>
          <div></div> {/* Empty for alignment */}
        </div>

        {/* Enhanced Subject Field */}
        <div>
          <label>Subject</label>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            <ReactQuill
              value={formData.subject}
              onChange={handleSubjectChange}
              modules={subjectModules}
              formats={subjectFormats}
              theme="snow"
              style={{ border: "none", fontSize: "14px" }}
              placeholder="Enter subject..."
            />
          </div>
        </div>

        {/* Enhanced Letter Body */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "5px",
            }}
          >
            <label>Letter Body</label>
            <button
              className="ai-trigger-btn"
              onClick={handleOpenAiModal}
              title="Generate letter content using AI"
            >
              <span>✨ Write with AI</span>
            </button>
          </div>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            <ReactQuill
              value={formData.body}
              onChange={handleBodyChange}
              modules={modules}
              formats={formats}
              theme="snow"
              style={{ minHeight: "300px", border: "none" }}
              placeholder="Write your letter content..."
            />
          </div>
        </div>

        {/* --- 2. BOTTOM 3-COLUMN GRID (Signatory, Internal Ref, External Ref) --- */}
        <div className="form-grid-layout">
          {/* Signatory */}
          <div>
            <label>Signatory</label>
            <select
              name="signatory"
              value={formData.signatory}
              onChange={handleChange}
            >
              <option value="">Select Signatory</option>
              {signatories.map((sig) => (
                <option key={sig.id} value={sig.id}>
                  {sig.email.full_name || sig.email.email}
                </option>
              ))}
            </select>
          </div>

          {/* Internal Ref */}
          <div style={{ position: "relative" }}>
            <label>Internal Letter Reference</label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                name="internalRef"
                value={formData.internalRef}
                onChange={handleInternalRefChange}
                onBlur={handleInternalRefBlur}
                // placeholder="Search internal references..."
              />
              <InternalRefSuggestionDropdown
                suggestions={internalRefSuggestions}
                isVisible={showInternalRefSuggestions}
                onSelect={handleInternalRefSelect}
              />
            </div>
            {/* Added Refs List */}
            <AddedInternalRefsDisplay
              references={formData.internalRefs}
              onRemove={handleRemoveInternalRef}
            />
          </div>

          {/* External Ref */}
          <div>
            <label>External Letter Reference</label>
            <input
              type="text"
              name="externalRef"
              value={formData.externalRef}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* --- END BOTTOM GRID --- */}

        {/* Attachments Section (Now Placed After) */}
        <div style={{ marginTop: "16px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <label style={{ fontSize: "16px", fontWeight: "500" }}>
              Attachments
            </label>
            <button
              type="button"
              onClick={handleAddAttachment}
              style={{
                padding: "6px 12px",
                backgroundColor: "#008FD5",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              + Add Attachment
            </button>
          </div>

          {formData.attachments.length === 0 ? (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f9f9f9",
                border: "1px dashed #ccc",
                borderRadius: "4px",
                color: "#666",
                fontSize: "14px",
              }}
            >
              No attachments added. Click "+ Add Attachment" to add one.
            </div>
          ) : (
            formData.attachments.map((attachment, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginBottom: "12px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div>
                  <label style={{ fontSize: "13px", color: "#666" }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={attachment.title || ""}
                    onChange={(e) => handleAttachmentTitleChange(e, index)}
                    placeholder="Attachment title"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#666" }}>
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, index)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  />
                  {attachment.file && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#008FD5",
                        marginTop: "4px",
                      }}
                    >
                      ✓ {attachment.file.name}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  style={{
                    padding: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "32px",
                    width: "32px",
                  }}
                  title="Remove attachment"
                >
                  <img
                    src={trashIcon}
                    alt="Remove"
                    style={{
                      width: "20px",
                      height: "20px",
                      opacity: "0.6",
                      display: "block",
                    }}
                  />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button type="submit" style={{ cursor: "pointer" }}>
            Preview & Save
          </button>
          <button type="button" onClick={() => window.history.back()}>
            Back
          </button>
        </div>

        {/* Preview Modal */}
        <PreviewLetter
          formData={formData}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onEdit={(editedContent) => {
            setFormData((prev) => ({
              ...prev,
              ...editedContent,
            }));
          }}
        />
      </div>

      {/* Sidebar */}
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Other Settings</h3>
        {[
          // Standard options (radio buttons)
          {
            label: "Show Recipient Name?",
            type: "radio",
            stateKey: "useRecipientName",
          },
          { label: "Add C.C Name?", type: "radio", stateKey: "useCCName" },
          // The CC options text fields for adding suggestions for recipients
          {
            label: "Copy Recipients (Same Organization)",
            type: "text",
            stateKey: "copySameOrg",
            hasButton: true,
            fieldType: "cc",
            recipients: formData.copySameOrgRecipients,
          },
          {
            label: "Copy Recipients (Other Organization)",
            type: "text",
            stateKey: "copyOtherOrg",
            hasButton: true,
            fieldType: "cc",
            recipients: formData.copyOtherOrgRecipients,
          },
          {
            label: "Copy Recipients (My Organization)",
            type: "text",
            stateKey: "copyMyOrg",
            hasButton: true,
            fieldType: "cc",
            recipients: formData.copyMyOrgRecipients,
          },
          // Standard options (radio buttons)
          {
            label: "Use Digital Signature?",
            type: "radio",
            stateKey: "useDigitalSignature",
          },
          {
            label: "Use Digital Letterhead?",
            type: "radio",
            stateKey: "useDigitalLetterhead",
          },
          {
            label: "Print Address Tags?",
            type: "radio",
            stateKey: "printAddressTags",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              marginBottom: item.hasButton ? "12px" : "16px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {item.label}
            </label>
            <div>
              {item.type === "radio" ? (
                <div style={{ display: "flex", gap: "12px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="radio"
                      name={`option-${i}`}
                      value="yes"
                      checked={formData[item.stateKey] === true}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          [item.stateKey]: true,
                        }));
                      }}
                    />
                    Yes
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="radio"
                      name={`option-${i}`}
                      value="no"
                      checked={formData[item.stateKey] === false}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          [item.stateKey]: false,
                        }));
                      }}
                    />
                    No
                  </label>
                </div>
              ) : item.type === "text" && item.fieldType === "cc" ? (
                <div style={{ position: "relative", width: "100%" }}>
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <input
                      type="text"
                      name={item.stateKey}
                      value={formData[item.stateKey] || ""}
                      onChange={handleCcChange}
                      onBlur={() => {
                        // Hide suggestions when field loses focus (with a small delay)
                        setTimeout(() => {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            [item.stateKey]: false,
                          }));
                        }, 200);
                      }}
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px",
                        height: "32px",
                        width: "100%",
                      }}
                      placeholder="Start typing for suggestions..."
                    />
                    {/* {item.hasButton && (
                      <button
                        type="button"
                        onClick={() => handleAddCcRecipient(item.stateKey)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#008FD5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "14px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          minWidth: "fit-content",
                        }}
                      >
                        + Add
                      </button>
                    )} */}
                  </div>
                  <SuggestionDropdown
                    suggestions={ccSuggestions[item.stateKey] || []}
                    isVisible={showSuggestions[item.stateKey]}
                    onSelect={handleSuggestionSelect}
                    fieldName={item.stateKey}
                  />

                  {/* Display added recipients */}
                  <AddedRecipientsDisplay
                    recipients={item.recipients}
                    fieldName={item.stateKey}
                    onRemove={handleRemoveRecipient}
                  />
                </div>
              ) : (
                // Regular text input (non-CC fields)
                <input
                  type="text"
                  name={item.stateKey}
                  value={formData[item.stateKey] || ""}
                  onChange={handleChange}
                  style={{
                    padding: "6px 8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    height: "32px",
                    width: "100%",
                  }}
                  placeholder="Enter value..."
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* AI POPUP MODAL (Full Screen Overlay)                              */}
      {/* ================================================================= */}
      {isAiModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent black backdrop
            backdropFilter: "blur(3px)", // Optional: adds a blur effect to background
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999, // Ensures it sits on top of everything
          }}
        >
          {/* Modal Content Box */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "1200px",
              maxHeight: "120vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              animation: "fadeIn 0.3s ease-in",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                ✨ SIL AI Writing Assistant
              </h3>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {/* &times; */}
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#f0f9ff",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#0c4a6e",
              }}
            >
              Describe what you want to write. Include key points, tone
              (formal/urgent), and specific details.
            </div>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Write a formal request to the Director regarding the budget allocation for Q3, emphasizing the deadline is next week..."
              style={{
                width: "100%",
                height: "300px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isGeneratingAi ? "#94a3b8" : "#008FD5",
                  color: "white",
                  cursor: isGeneratingAi ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isGeneratingAi ? <>Processing...</> : <>Generate Text ⚡</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal (Existing logic) */}
      {isPreviewOpen && (
        <PreviewLetter
          formData={formData}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </form>
  );
}
