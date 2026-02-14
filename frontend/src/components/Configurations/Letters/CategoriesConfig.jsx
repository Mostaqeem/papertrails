import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";

/**
 * CategoriesConfig - Configuration page for managing letter categories
 */
const CategoriesConfig = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Fetch categories from API
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/letters/categories_crud/");
      console.log("Categories response:", response.data);
      let categoriesList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      console.log("Parsed categories list:", categoriesList);
      setCategories(categoriesList);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    navigate("/configurations/letters/categories/add");
  };
  const handleEdit = (catId) => {
    navigate(`/configurations/letters/categories/${catId}/edit`);
  };
  const handleDelete = async (catId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/letters/categories_crud/${catId}/`);
      setCategories(categories.filter((cat) => cat.id !== catId));
      setError(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Failed to delete category");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Letter Categories Configuration</h2>
        <button className="btn btn-add " onClick={() => handleAddCategory()}>
          Add New
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading categories...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3">No categories configured yet.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>{cat.description}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(cat.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <img src={deleteIcon} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoriesConfig;
