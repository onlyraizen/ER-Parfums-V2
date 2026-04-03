// AddProductPage.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient'; // Import your client


export default function AddProductPage() {

// Inside your component, near the top
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // THIS is where the code goes
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Please select an image first!");
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `perfume_${Date.now()}_${file.name}`;

      // Step 1: Upload Image
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Step 2: Get Public URL
      const { data: urlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Step 3: Save to Database
      const { data: dbData, error: dbError } = await supabase
        .from('products')
        .insert([
          {
            name: productName,
            // Add your other fields here like price, volume, etc.
            image_url: imageUrl 
          }
        ]);

      if (dbError) throw dbError;

      alert("Product added successfully!");
      
    } catch (error) {
      console.error("Error adding product:", error.message);
      alert("Failed to add product.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Product Name" 
        onChange={(e) => setProductName(e.target.value)} 
      />
      
      {/* The file input where you grab the image */}
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        onChange={(e) => setFile(e.target.files[0])} 
      />
      
      <button type="submit" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Save Product"}
      </button>
    </form>
  );
}