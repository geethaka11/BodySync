import React, { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import axios from 'axios';
import { 
  Trash2, 
  Edit2, 
  Plus, 
  Filter, 
  Upload, 
  Image as ImageIcon 
} from 'lucide-react';

const CATEGORIES = [
  'Abs Exercises', 'Chest Exercises', 'Biceps Exercises', 
  'Forearm Exercises', 'Triceps Exercises', 'Calf Exercises', 
  'Glute Exercises', 'Hamstring Exercises', 'Quad Exercises', 
  'Lats Exercises', 'Lower Back Exercises', 'Upper Back Exercises'
];

const ImageUploader = ({ 
  name, 
  label, 
  onChange, 
  required = false,
  existingImage = null 
}) => {
  const [preview, setPreview] = useState(existingImage);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onChange(e);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-accent/80">
        {label}
      </label>
      <div 
        className={`relative w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center 
        ${preview 
          ? 'border-primary bg-secondary' 
          : 'border-accent/30 bg-secondary hover:border-primary'}`}
      >
        {preview ? (
          <img 
            src={preview.startsWith('data:') 
              ? preview 
              : `${import.meta.env.VITE_IMAGE_URL}/uploads/exercises/${preview}`
            } 
            alt="Preview" 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <input
              type="file"
              name={name}
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              required={required}
              id={`file-upload-${name}`}
            />
            <label 
              htmlFor={`file-upload-${name}`} 
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-10 h-10 text-accent/50 mb-2" />
              <p className="text-accent/70">
                Upload {label.toLowerCase()}
              </p>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/90 backdrop-blur-sm">
      <div className="w-96 p-8 rounded-2xl bg-secondary border border-dark shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-primary/30 rounded-full">
            <Trash2 className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="mb-4 text-xl font-semibold text-center text-accent">{message}</h2>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={onConfirm} 
            className="flex items-center px-4 py-2 text-accent bg-primary rounded-lg hover:opacity-90 transition"
          >
            Confirm
          </button>
          <button 
            onClick={onClose} 
            className="flex items-center px-4 py-2 text-accent/70 bg-dark rounded-lg hover:opacity-90 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminExercises = () => {
  const { token } = useAdminAuth();
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    youtubeLink: '',
    image: null,
    categoryImage: null
  });
  const [editingExercise, setEditingExercise] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchExercises();
  }, [selectedCategory]);

  const fetchExercises = async () => {
    try {
      const url = selectedCategory 
        ? `/api/admin/exercises/category/${selectedCategory}` 
        : '/api/admin/exercises';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formPayload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) formPayload.append(key, formData[key]);
    });

    try {
      if (editingExercise) {
        await axios.put(`/api/admin/exercises/${editingExercise._id}`, formPayload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/admin/exercises', formPayload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      fetchExercises();
      resetForm();
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/exercises/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchExercises();
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      youtubeLink: '',
      image: null,
      categoryImage: null
    });
    setEditingExercise(null);
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      category: exercise.category,
      youtubeLink: exercise.youtubeLink,
      image: exercise.image,
      categoryImage: exercise.categoryImage
    });
  };

  return (
    <div className="min-h-screen bg-secondary text-accent p-8">
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        message="Delete this exercise?"
      />

      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-accent">Exercise Management</h1>
         
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Exercise Form */}
          <div className="lg:col-span-1 bg-dark rounded-2xl p-6 border border-dark">
            <h2 className="text-2xl font-semibold mb-6 text-accent">
              {editingExercise ? 'Edit Exercise' : 'Create Exercise'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Exercise Name"
                className="w-full px-3 py-2 bg-secondary text-accent rounded-lg border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-secondary text-accent rounded-lg border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-dark">{cat}</option>
                ))}
              </select>
              <input
                type="text"
                name="youtubeLink"
                value={formData.youtubeLink}
                onChange={handleInputChange}
                placeholder="YouTube Tutorial Link"
                className="w-full px-3 py-2 bg-secondary text-accent rounded-lg border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <ImageUploader
                  name="image"
                  label="Exercise Image"
                  onChange={handleInputChange}
                  required={!editingExercise}
                  existingImage={editingExercise?.image}
                />
                <ImageUploader
                  name="categoryImage"
                  label="Category Image"
                  onChange={handleInputChange}
                  required={!editingExercise}
                  existingImage={editingExercise?.categoryImage}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="submit"
                  className="w-full py-2 bg-primary text-accent rounded-lg hover:opacity-90 transition"
                >
                  {editingExercise ? 'Update Exercise' : 'Add Exercise'}
                </button>
                {editingExercise && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-2 bg-dark text-accent/70 rounded-lg hover:opacity-90 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Exercise List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center flex-grow">
                <Filter className="w-5 h-5 mr-2 text-accent/50" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-dark text-accent rounded-lg border border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-dark">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {exercises.map(exercise => (
                <div 
                  key={exercise._id} 
                  className="flex items-center justify-between bg-dark rounded-xl p-4 border border-dark hover:border-primary/50 transition"
                >
                  <div className="flex items-center space-x-6">
                    <img 
                      src={`${import.meta.env.VITE_IMAGE_URL}/uploads/exercises/${exercise.image}`}
                      alt={exercise.name} 
                      className="w-16 h-16 object-cover rounded-lg"
                      
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-accent">{exercise.name}</h3>
                      <p className="text-sm text-accent/50">{exercise.category}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-2 text-primary hover:bg-secondary rounded-lg transition"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(exercise._id)}
                      className="p-2 text-primary hover:bg-secondary rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExercises;