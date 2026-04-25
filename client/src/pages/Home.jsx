import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Predefined spices
const PREDEFINED_SPICES = ['מלח', 'כמון', 'כורכום', 'פלפל שחור', 'פפריקה מתוקה']
const SPICE_AMOUNTS = ['רבע כפית', 'חצי כפית', 'כפית', 'כפית וחצי', '2 כפיות']

// Spices Editor Component
function SpicesEditor({ spices, onChange, customSpices, onAddCustomSpice }) {
  const [newCustomSpice, setNewCustomSpice] = useState('')
  const allSpices = [...PREDEFINED_SPICES, ...customSpices]

  const addSpice = (spiceName) => {
    if (!spices.find(s => s.name === spiceName)) {
      onChange([...spices, { name: spiceName, amount: 'כפית' }])
    }
  }

  const removeSpice = (spiceName) => {
    onChange(spices.filter(s => s.name !== spiceName))
  }

  const updateAmount = (spiceName, amount) => {
    onChange(spices.map(s => s.name === spiceName ? { ...s, amount } : s))
  }

  const handleAddCustom = () => {
    if (newCustomSpice.trim() && !allSpices.includes(newCustomSpice.trim())) {
      onAddCustomSpice(newCustomSpice.trim())
      addSpice(newCustomSpice.trim())
      setNewCustomSpice('')
    }
  }

  return (
    <div className="spices-editor">
      <label className="spices-label">תבלינים</label>

      {/* Selected spices */}
      {spices.length > 0 && (
        <div className="selected-spices">
          {spices.map(spice => (
            <div key={spice.name} className="spice-item">
              <span className="spice-name">{spice.name}</span>
              <select
                value={spice.amount}
                onChange={(e) => updateAmount(spice.name, e.target.value)}
                className="spice-amount"
              >
                {SPICE_AMOUNTS.map(amt => (
                  <option key={amt} value={amt}>{amt}</option>
                ))}
              </select>
              <button
                type="button"
                className="remove-spice"
                onClick={() => removeSpice(spice.name)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add spice dropdown */}
      <div className="add-spice-row">
        <select
          className="spice-select"
          value=""
          onChange={(e) => e.target.value && addSpice(e.target.value)}
        >
          <option value="">+ הוסף תבלין...</option>
          {allSpices.filter(s => !spices.find(sp => sp.name === s)).map(spice => (
            <option key={spice} value={spice}>{spice}</option>
          ))}
        </select>

        {/* Custom spice input */}
        <div className="custom-spice-input">
          <input
            type="text"
            placeholder="תבלין חדש..."
            value={newCustomSpice}
            onChange={(e) => setNewCustomSpice(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
          />
          <button type="button" onClick={handleAddCustom} className="add-custom-btn">
            +
          </button>
        </div>
      </div>
    </div>
  )
}

// Stages Editor Component
function StagesEditor({ stages, onChange }) {
  const addStage = () => {
    onChange([...stages, { title: '', description: '' }])
  }

  const removeStage = (index) => {
    onChange(stages.filter((_, i) => i !== index))
  }

  const updateStage = (index, field, value) => {
    onChange(stages.map((stage, i) => i === index ? { ...stage, [field]: value } : stage))
  }

  return (
    <div className="stages-editor">
      <label className="stages-label">הוראות הכנה</label>

      {stages.map((stage, index) => (
        <div key={index} className="stage-item">
          <div className="stage-header">
            <span className="stage-number">שלב {index + 1}</span>
            <button
              type="button"
              className="remove-stage"
              onClick={() => removeStage(index)}
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="כותרת השלב (אופציונלי)"
            value={stage.title}
            onChange={(e) => updateStage(index, 'title', e.target.value)}
            className="stage-title-input"
          />
          <textarea
            placeholder="תיאור השלב..."
            value={stage.description}
            onChange={(e) => updateStage(index, 'description', e.target.value)}
            rows={3}
            className="stage-description-input"
          />
        </div>
      ))}

      <button type="button" className="add-stage-btn" onClick={addStage}>
        + הוסף שלב
      </button>
    </div>
  )
}

// Difficulty component with muscle icons
function DifficultyMeter({ level, onChange, editable = false }) {
  const muscles = []
  for (let i = 1; i <= 5; i++) {
    muscles.push(
      <span
        key={i}
        className={`muscle ${i <= level ? 'active' : ''} ${editable ? 'editable' : ''}`}
        onClick={() => editable && onChange && onChange(i)}
        title={editable ? `רמת קושי ${i}` : ''}
      >
        💪
      </span>
    )
  }
  return <div className="difficulty-meter">{muscles}</div>
}

// Spiciness component with pepper icons
function SpicinessMeter({ level, onChange, editable = false }) {
  const handleClick = (i) => {
    if (!editable || !onChange) return
    // Click on current level to clear, otherwise set to clicked level
    onChange(i === level ? 0 : i)
  }

  const peppers = []
  for (let i = 1; i <= 5; i++) {
    peppers.push(
      <span
        key={i}
        className={`pepper ${i <= level ? 'active' : ''} ${editable ? 'editable' : ''}`}
        onClick={() => handleClick(i)}
        title={editable ? (i === level ? 'לחץ לביטול' : `רמת חריפות ${i}`) : ''}
      >
        🌶️
      </span>
    )
  }
  return <div className="spiciness-meter">{peppers}</div>
}

// Image Gallery Component
function ImageGallery({ images, onDelete, onSetMain, editable = false }) {
  const [activeId, setActiveId] = useState(null)

  if (!images || images.length === 0) return null

  // Find current image by ID, or default to first image
  const currentImage = images.find(img => img._id === activeId) || images[0]
  const activeIndex = images.findIndex(img => img._id === currentImage._id)

  const handleSetMain = async (imageId) => {
    await onSetMain(imageId)
    setActiveId(imageId) // Stay on the image we just set as main
  }

  return (
    <div className="image-gallery">
      <div className="main-image">
        <img src={`${API_URL}/images/${currentImage._id}`} alt="Recipe" />
        {editable && (
          <div className="image-actions">
            <button
              className="delete-image-btn"
              onClick={() => onDelete(currentImage._id)}
              title="מחק תמונה"
            >
              ✕
            </button>
            {images.length > 1 && !currentImage.isMain && (
              <button
                className="set-main-btn"
                onClick={() => handleSetMain(currentImage._id)}
                title="הגדר כתמונה ראשית"
              >
                ☆
              </button>
            )}
          </div>
        )}
        {currentImage.isMain && (
          <span className="main-badge" title="תמונה ראשית">⭐</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="thumbnail-row">
          {images.map((img, idx) => (
            <div
              key={img._id}
              className={`thumbnail ${idx === activeIndex ? 'active' : ''} ${img.isMain ? 'is-main' : ''}`}
              onClick={() => setActiveId(img._id)}
            >
              <img src={`${API_URL}/images/${img._id}`} alt={`Thumbnail ${idx + 1}`} />
              {img.isMain && <span className="thumbnail-main-badge">⭐</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Image Upload Component
function ImageUploader({ recipeId, images, onUpload, onDelete, onSetMain, authFetch }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const remainingSlots = 3 - (images?.length || 0)
    if (files.length > remainingSlots) {
      alert(`ניתן להעלות עוד ${remainingSlots} תמונות בלבד`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))

    try {
      const res = await authFetch(`${API_URL}/images/recipe/${recipeId}`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        onUpload()
      } else {
        const err = await res.json()
        alert(err.message || 'שגיאה בהעלאת התמונות')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('שגיאה בהעלאת התמונות')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const canUpload = !images || images.length < 3

  return (
    <div className="image-uploader">
      <ImageGallery images={images} onDelete={onDelete} onSetMain={onSetMain} editable={true} />

      {canUpload && (
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            id="image-upload"
          />
          <label htmlFor="image-upload" className={`upload-label ${uploading ? 'uploading' : ''}`}>
            {uploading ? (
              <span>מעלה...</span>
            ) : (
              <>
                <span className="upload-icon">📷</span>
                <span>העלה תמונות ({images?.length || 0}/3)</span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  )
}

function Home() {
  const { isAuthenticated, authFetch, user } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showGiftCard, setShowGiftCard] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [giftMessage, setGiftMessage] = useState('')
  const [giftEmail, setGiftEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [includeRecipeImage, setIncludeRecipeImage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showMyRecipesOnly, setShowMyRecipesOnly] = useState(false)
  const [recipeImages, setRecipeImages] = useState([])
  const [editImages, setEditImages] = useState([])
  const [customSpices, setCustomSpices] = useState([])
  const giftCardRef = useRef(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    ingredients: '',
    spices: [],
    stages: [{ title: '', description: '' }],
    cookTime: '',
    servings: '',
    category: '',
    origin: '',
    difficulty: 3,
    spiciness: 0,
    isVegan: false,
    isVegetarian: false,
    isPrivate: false
  })

  useEffect(() => {
    fetchRecipes()
  }, [searchQuery])

  useEffect(() => {
    if (selectedRecipe) {
      fetchRecipeImages(selectedRecipe._id)
    } else {
      setRecipeImages([])
    }
  }, [selectedRecipe])

  // Clear selected recipe when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedRecipe(null)
    }
  }, [isAuthenticated])

  const fetchRecipes = async () => {
    try {
      const url = searchQuery
        ? `${API_URL}/recipes?search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/recipes`

      // Include auth token to properly filter private recipes
      const headers = {}
      const token = localStorage.getItem('token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(url, { headers })
      const data = await res.json()

      // Fetch first image for each recipe (for thumbnails)
      const recipesWithImages = await Promise.all(
        data.map(async (recipe) => {
          try {
            const imgRes = await fetch(`${API_URL}/images/recipe/${recipe._id}`)
            const images = await imgRes.json()
            // Use main image for thumbnail, or first image as fallback
            const mainImage = images.find(img => img.isMain) || images[0]
            return { ...recipe, thumbnailId: mainImage?._id }
          } catch {
            return recipe
          }
        })
      )

      setRecipes(recipesWithImages)
    } catch (err) {
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipeImages = async (recipeId) => {
    try {
      const res = await fetch(`${API_URL}/images/recipe/${recipeId}`)
      const data = await res.json()
      setRecipeImages(data)
    } catch (err) {
      console.error('Error fetching images:', err)
      setRecipeImages([])
    }
  }

  const fetchEditImages = async (recipeId) => {
    try {
      const res = await fetch(`${API_URL}/images/recipe/${recipeId}`)
      const data = await res.json()
      setEditImages(data)
    } catch (err) {
      console.error('Error fetching images:', err)
      setEditImages([])
    }
  }

  const selectRecipe = async (recipe) => {
    try {
      // Fetch recipe from API to increment views and get view count if owner/admin
      const res = await authFetch(`${API_URL}/recipes/${recipe._id}`)
      const data = await res.json()
      setSelectedRecipe(data)
    } catch (err) {
      console.error('Error fetching recipe:', err)
      setSelectedRecipe(recipe)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { instructions, ...formWithoutInstructions } = form
    const recipeData = {
      ...formWithoutInstructions,
      ingredients: form.ingredients.split('\n').filter(i => i.trim()),
      stages: form.stages.filter(s => s.description.trim()),
      cookTime: form.cookTime ? parseInt(form.cookTime) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      difficulty: form.difficulty || null,
      spiciness: form.spiciness || null
    }

    try {
      if (editingId) {
        await authFetch(`${API_URL}/recipes/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeData)
        })
        setEditingId(null)
      } else {
        await authFetch(`${API_URL}/recipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeData)
        })
      }
      resetForm()
      fetchRecipes()
    } catch (err) {
      console.error('Error saving recipe:', err)
    }
  }

  const handleEdit = (recipe) => {
    // Convert old instructions to stages if needed
    let stages = recipe.stages || []
    if (stages.length === 0 && recipe.instructions) {
      stages = [{ title: '', description: recipe.instructions }]
    }
    if (stages.length === 0) {
      stages = [{ title: '', description: '' }]
    }

    setForm({
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients?.join('\n') || '',
      spices: recipe.spices || [],
      stages: stages,
      cookTime: recipe.cookTime?.toString() || '',
      servings: recipe.servings?.toString() || '',
      category: recipe.category || '',
      origin: recipe.origin || '',
      difficulty: recipe.difficulty || 3,
      spiciness: recipe.spiciness || 0,
      isVegan: recipe.isVegan || false,
      isVegetarian: recipe.isVegetarian || false,
      isPrivate: recipe.isPrivate || false
    })
    // Load any custom spices from the recipe
    const existingCustom = (recipe.spices || [])
      .map(s => s.name)
      .filter(name => !PREDEFINED_SPICES.includes(name))
    setCustomSpices(prev => [...new Set([...prev, ...existingCustom])])
    setEditingId(recipe._id)
    setSelectedRecipe(null)
    setShowForm(true)
    fetchEditImages(recipe._id)
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק את המתכון?')) return
    try {
      // Delete images first
      await authFetch(`${API_URL}/images/recipe/${id}`, { method: 'DELETE' })
      // Then delete recipe
      await authFetch(`${API_URL}/recipes/${id}`, { method: 'DELETE' })
      setSelectedRecipe(null)
      fetchRecipes()
    } catch (err) {
      console.error('Error deleting recipe:', err)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!confirm('למחוק את התמונה?')) return
    try {
      await authFetch(`${API_URL}/images/${imageId}`, { method: 'DELETE' })
      fetchRecipeImages(selectedRecipe._id)
    } catch (err) {
      console.error('Error deleting image:', err)
    }
  }

  const handleDeleteEditImage = async (imageId) => {
    if (!confirm('למחוק את התמונה?')) return
    try {
      await authFetch(`${API_URL}/images/${imageId}`, { method: 'DELETE' })
      fetchEditImages(editingId)
    } catch (err) {
      console.error('Error deleting image:', err)
    }
  }

  const handleSetMainImage = async (imageId) => {
    try {
      await authFetch(`${API_URL}/images/${imageId}/main`, { method: 'PATCH' })
      fetchEditImages(editingId)
    } catch (err) {
      console.error('Error setting main image:', err)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      ingredients: '',
      spices: [],
      stages: [{ title: '', description: '' }],
      cookTime: '',
      servings: '',
      category: '',
      origin: '',
      difficulty: 3,
      spiciness: 0,
      isVegan: false,
      isVegetarian: false,
      isPrivate: false
    })
    setEditingId(null)
    setShowForm(false)
    setEditImages([])
  }

  const shareGiftCard = async () => {
    // Validate email
    if (!giftEmail.trim()) {
      alert('נא להזין כתובת אימייל')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(giftEmail)) {
      alert('כתובת אימייל לא תקינה')
      return
    }

    setSendingEmail(true)

    try {
      const res = await fetch(`${API_URL}/email/send-gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: giftEmail,
          recipe: selectedRecipe,
          message: giftMessage
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert('המתכון נשלח בהצלחה!')
        setShowGiftCard(false)
        setGiftEmail('')
        setGiftMessage('')
      } else {
        if (data.notConfigured) {
          alert('שליחת אימייל לא מוגדרת. יש להגדיר GMAIL_USER ו-GMAIL_APP_PASSWORD בקובץ .env')
        } else {
          alert('שגיאה בשליחת האימייל: ' + data.message)
        }
      }
    } catch (err) {
      console.error('Email send error:', err)
      alert('שגיאה בשליחת האימייל')
    } finally {
      setSendingEmail(false)
    }
  }


  const printGiftCard = () => {
    window.print()
  }

  const downloadAsImage = async () => {
    const cardElement = giftCardRef.current
    if (!cardElement) return

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      })

      const link = document.createElement('a')
      link.download = `מתכון-${selectedRecipe.title}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Failed to generate image:', err)
      alert('שגיאה ביצירת התמונה')
    }
  }

  const shareWhatsApp = async () => {
    // Build plain text version for WhatsApp
    const difficultyText = selectedRecipe.difficulty ? `רמת קושי: ${'💪'.repeat(selectedRecipe.difficulty)}` : ''
    const spicinessText = selectedRecipe.spiciness ? `רמת חריפות: ${'🌶️'.repeat(selectedRecipe.spiciness)}` : ''
    const originText = selectedRecipe.origin ? `🌍 מקור: ${selectedRecipe.origin}` : ''
    const cookTimeText = selectedRecipe.cookTime ? `⏱️ זמן הכנה: ${selectedRecipe.cookTime} דקות` : ''
    const servingsText = selectedRecipe.servings ? `🍽️ מנות: ${selectedRecipe.servings}` : ''
    const veganText = selectedRecipe.isVegan ? '🌱 טבעוני' : ''
    const vegetarianText = selectedRecipe.isVegetarian ? '🥬 צמחוני' : ''

    const metaLine = [originText, cookTimeText, servingsText, difficultyText, spicinessText, veganText, vegetarianText].filter(Boolean).join(' | ')

    const ingredientsText = selectedRecipe.ingredients?.length > 0
      ? `\n\n*מצרכים:*\n${selectedRecipe.ingredients.map(i => `• ${i}`).join('\n')}`
      : ''

    const spicesText = selectedRecipe.spices?.length > 0
      ? `\n\n*תבלינים:*\n${selectedRecipe.spices.map(s => `• ${s.name} - ${s.amount}`).join('\n')}`
      : ''

    let instructionsText = ''
    if (selectedRecipe.stages?.length > 0) {
      instructionsText = `\n\n*הוראות הכנה:*\n${selectedRecipe.stages.map((stage, i) => {
        const title = stage.title ? `*שלב ${i + 1}: ${stage.title}*` : `*שלב ${i + 1}*`
        return `${title}\n${stage.description}`
      }).join('\n\n')}`
    } else if (selectedRecipe.instructions) {
      instructionsText = `\n\n*הוראות הכנה:*\n${selectedRecipe.instructions}`
    }

    const text = `🎁 *מתכון במתנה: ${selectedRecipe.title}*\n\n` +
      (selectedRecipe.description ? `_${selectedRecipe.description}_\n\n` : '') +
      (metaLine ? `${metaLine}\n` : '') +
      ingredientsText +
      spicesText +
      instructionsText +
      (giftMessage ? `\n\n💌 "${giftMessage}"` : '') +
      `\n\n_בתיאבון!_ 🍽️`

    // Try to share with image first (mobile)
    if (navigator.share && navigator.canShare) {
      try {
        // Generate image from gift card
        const cardElement = giftCardRef.current
        if (cardElement) {
          const canvas = await html2canvas(cardElement, {
            backgroundColor: null,
            scale: 2,
            useCORS: true
          })

          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
          const file = new File([blob], `recipe-${selectedRecipe.title}.png`, { type: 'image/png' })

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `מתכון: ${selectedRecipe.title}`,
              text: giftMessage || 'מתכון במתנה!',
              files: [file]
            })
            return
          }
        }
      } catch (err) {
        console.log('Image share failed, falling back to text:', err)
      }
    }

    // Fallback: Open WhatsApp with text
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  // Recipe detail view
  if (selectedRecipe) {
    return (
      <div className="home-content">
        {/* Gift Card Modal */}
        {showGiftCard && (
          <div className="gift-modal-overlay" onClick={() => setShowGiftCard(false)}>
            <div className="gift-modal" onClick={(e) => e.stopPropagation()}>
              <button className="gift-modal-close" onClick={() => setShowGiftCard(false)}>✕</button>

              <div className="gift-modal-content">
                <h2 className="gift-modal-title">תצוגה מקדימה</h2>

                <div className="gift-card-preview" ref={giftCardRef}>
                  <div className="gift-card-paper">
                    <div className="gift-card-header">מתכון במתנה</div>

                    <h1 className="gift-card-title">{selectedRecipe.title}</h1>

                    {selectedRecipe.description && (
                      <p className="gift-card-desc">{selectedRecipe.description}</p>
                    )}

                    <div className="gift-card-meta">
                      {selectedRecipe.origin && <span>🌍 {selectedRecipe.origin}</span>}
                      {selectedRecipe.cookTime && <span>⏱️ {selectedRecipe.cookTime} דק׳</span>}
                      {selectedRecipe.servings && <span>🍽️ {selectedRecipe.servings} מנות</span>}
                      {selectedRecipe.difficulty && <span>💪×{selectedRecipe.difficulty}</span>}
                      {selectedRecipe.spiciness && <span>🌶️×{selectedRecipe.spiciness}</span>}
                      {selectedRecipe.isVegan && <span>🌱 טבעוני</span>}
                      {selectedRecipe.isVegetarian && <span>🥬 צמחוני</span>}
                    </div>

                    <div className="gift-card-ingredients-row">
                      <div className="gift-card-section">
                        <h3>מצרכים</h3>
                        <ul>
                          {selectedRecipe.ingredients?.map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>

                      {selectedRecipe.spices?.length > 0 && (
                        <div className="gift-card-section gift-card-spices">
                          <h3>תבלינים</h3>
                          <ul>
                            {selectedRecipe.spices.map((spice, i) => (
                              <li key={i}>{spice.name} - {spice.amount}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="gift-card-section">
                      <h3>הוראות הכנה</h3>
                      <div className="gift-card-instructions">
                        {selectedRecipe.stages?.length > 0 ? (
                          selectedRecipe.stages.map((stage, i) => (
                            <div key={i} className="gift-card-stage">
                              {(stage.title || selectedRecipe.stages.length > 1) && (
                                <strong>{stage.title ? `${stage.title}:` : `שלב ${i + 1}:`}</strong>
                              )}
                              <span>{stage.description}</span>
                            </div>
                          ))
                        ) : selectedRecipe.instructions ? (
                          <div className="gift-card-stage">{selectedRecipe.instructions}</div>
                        ) : null}
                      </div>
                    </div>

                    {giftMessage && (
                      <div className="gift-card-message">"{giftMessage}"</div>
                    )}

                    {includeRecipeImage && recipeImages.length > 0 && (
                      <div className="gift-card-image">
                        <img
                          src={`${API_URL}/images/${(recipeImages.find(img => img.isMain) || recipeImages[0])._id}`}
                          alt={selectedRecipe.title}
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}

                    <div className="gift-card-footer">בתיאבון! 🍽️</div>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <input
                    type="email"
                    className="gift-email-input"
                    placeholder="כתובת אימייל לשליחה..."
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                  />
                )}

                <textarea
                  className="gift-message-input"
                  placeholder="הוסף ברכה אישית (אופציונלי)..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  rows={2}
                />

                {recipeImages.length > 0 && (
                  <label className="gift-include-image-checkbox">
                    <input
                      type="checkbox"
                      checked={includeRecipeImage}
                      onChange={(e) => setIncludeRecipeImage(e.target.checked)}
                    />
                    <span>הוסף תמונה ראשית</span>
                  </label>
                )}

                <div className="gift-modal-actions">
                  <button onClick={downloadAsImage} className="gift-action-btn">
                    📥 הורד תמונה
                  </button>
                  <button onClick={printGiftCard} className="gift-action-btn">
                    🖨️ הדפס
                  </button>
                  <button onClick={shareWhatsApp} className="gift-action-btn whatsapp">
                    💬 וואטסאפ
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={shareGiftCard}
                      className="gift-action-btn primary"
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? '📧 שולח...' : '📧 אימייל'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="container">
          <div className="detail-top-bar">
            <button className="back-btn" onClick={() => setSelectedRecipe(null)}>
              חזרה למתכונים
            </button>
            <div className="detail-actions">
              <button className="gift-btn" onClick={() => { setIncludeRecipeImage(false); setShowGiftCard(true); }}>
                🎁 שלח כמתנה
              </button>
              {isAuthenticated && (user?.userId === selectedRecipe.userId || user?.role === 'admin') && (
                <>
                  <button onClick={() => handleEdit(selectedRecipe)}>✏️ ערוך</button>
                  <button className="delete" onClick={() => handleDelete(selectedRecipe._id)}>
                    🗑️ מחק
                  </button>
                </>
              )}
            </div>
          </div>
          <article className="recipe-detail">
            <header>
              <h1>{selectedRecipe.title}</h1>
              <div className="tags-row">
                {selectedRecipe.category && (
                  <span className="category">{selectedRecipe.category}</span>
                )}
                {selectedRecipe.origin && (
                  <span className="origin-tag">🌍 {selectedRecipe.origin}</span>
                )}
                {selectedRecipe.isVegan && (
                  <span className="dietary-tag vegan">🌱 טבעוני</span>
                )}
                {selectedRecipe.isVegetarian && (
                  <span className="dietary-tag vegetarian">🥬 צמחוני</span>
                )}
                {selectedRecipe.isPrivate && (
                  <span className="dietary-tag private">🔒 פרטי</span>
                )}
              </div>
            </header>

            {selectedRecipe.description && (
              <p className="description">{selectedRecipe.description}</p>
            )}

            <div className="meta">
              {selectedRecipe.cookTime && (
                <span>⏱️ זמן הכנה: {selectedRecipe.cookTime} דקות</span>
              )}
              {selectedRecipe.servings && (
                <span>🍽️ מנות: {selectedRecipe.servings}</span>
              )}
              {selectedRecipe.difficulty && (
                <span className="difficulty-display">
                  רמת קושי: <DifficultyMeter level={selectedRecipe.difficulty} />
                </span>
              )}
              {selectedRecipe.spiciness && (
                <span className="spiciness-display">
                  רמת חריפות: <SpicinessMeter level={selectedRecipe.spiciness} />
                </span>
              )}
              {selectedRecipe.views !== undefined && (
                <span className="views-display">👁️ צפיות: {selectedRecipe.views}</span>
              )}
            </div>

            <div className="ingredients-spices-row">
              {selectedRecipe.ingredients?.length > 0 && (
                <section className="ingredients-section">
                  <h2>מצרכים</h2>
                  <ul className="ingredients-list">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedRecipe.spices?.length > 0 && (
                <section className="spices-section">
                  <h2>🧂 תבלינים</h2>
                  <ul className="spices-list">
                    {selectedRecipe.spices.map((spice, i) => (
                      <li key={i}>
                        <span className="spice-name-display">{spice.name}</span>
                        <span className="spice-amount-display">{spice.amount}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <section>
              <h2>הוראות הכנה</h2>
              {selectedRecipe.stages?.length > 0 ? (
                <div className="stages-display">
                  {selectedRecipe.stages.map((stage, i) => (
                    <div key={i} className="stage-display-item">
                      {stage.title && <h3 className="stage-title">שלב {i + 1}: {stage.title}</h3>}
                      {!stage.title && selectedRecipe.stages.length > 1 && <h3 className="stage-title">שלב {i + 1}</h3>}
                      <div className="stage-description">{stage.description}</div>
                    </div>
                  ))}
                </div>
              ) : selectedRecipe.instructions ? (
                <div className="instructions">
                  {selectedRecipe.instructions.split('\n').map((step, i) => (
                    <p key={i}>{step}</p>
                  ))}
                </div>
              ) : null}
            </section>

            {recipeImages.length > 0 && (
              <section className="images-section">
                <h2>תמונות</h2>
                <ImageGallery images={recipeImages} editable={false} />
              </section>
            )}
          </article>
        </div>
      </div>
    )
  }

  // Form view
  if (showForm) {
    return (
      <div className="home-content">
        <div className="container">
          <button className="back-btn" onClick={resetForm}>
            ביטול
          </button>
          <h1 className="page-title">{editingId ? 'עריכת מתכון' : 'מתכון חדש'}</h1>
          <form onSubmit={handleSubmit} className="recipe-form">
            <input
              type="text"
              placeholder="שם המתכון"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="תיאור קצר"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="form-row">
              <input
                type="number"
                placeholder="זמן הכנה (דקות)"
                value={form.cookTime}
                onChange={(e) => setForm({ ...form, cookTime: e.target.value })}
              />
              <input
                type="number"
                placeholder="מספר מנות"
                value={form.servings}
                onChange={(e) => setForm({ ...form, servings: e.target.value })}
              />
              <input
                type="text"
                placeholder="קטגוריה"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="מקור המתכון (למשל: מרוקו, איטליה)"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
              <div className="difficulty-picker">
                <span className="difficulty-label">רמת קושי:</span>
                <DifficultyMeter
                  level={form.difficulty}
                  onChange={(level) => setForm({ ...form, difficulty: level })}
                  editable={true}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="spiciness-picker">
                <span className="spiciness-label">רמת חריפות:</span>
                <SpicinessMeter
                  level={form.spiciness}
                  onChange={(level) => setForm({ ...form, spiciness: level })}
                  editable={true}
                />
              </div>
            </div>
            <div className="form-row dietary-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isVegan}
                  onChange={(e) => setForm({ ...form, isVegan: e.target.checked })}
                />
                <span>🌱 טבעוני</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isVegetarian}
                  onChange={(e) => setForm({ ...form, isVegetarian: e.target.checked })}
                />
                <span>🥬 צמחוני</span>
              </label>
              <label className="checkbox-label private-checkbox">
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                />
                <span>🔒 פרטי</span>
              </label>
            </div>
            <textarea
              placeholder="מצרכים (כל מצרך בשורה נפרדת)"
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              rows={6}
            />
            <SpicesEditor
              spices={form.spices}
              onChange={(spices) => setForm({ ...form, spices })}
              customSpices={customSpices}
              onAddCustomSpice={(spice) => setCustomSpices(prev => [...prev, spice])}
            />
            <StagesEditor
              stages={form.stages}
              onChange={(stages) => setForm({ ...form, stages })}
            />
            <button type="submit">{editingId ? 'עדכן' : 'הוסף'} מתכון</button>
          </form>

          {editingId && (
            <section className="images-section edit-images">
              <h2>תמונות</h2>
              <ImageUploader
                recipeId={editingId}
                images={editImages}
                onUpload={() => fetchEditImages(editingId)}
                onDelete={handleDeleteEditImage}
                onSetMain={handleSetMainImage}
                authFetch={authFetch}
              />
            </section>
          )}
        </div>
      </div>
    )
  }

  // Main recipe list view
  return (
    <div className="home-content">
      <div className="container">
        <div className="home-hero">
          <h1 className="home-title">המתכונים שלי</h1>
          <p className="home-subtitle">גלה, שמור ושתף את המתכונים האהובים עליך</p>
          {isAuthenticated && (
            <button className="add-recipe-btn" onClick={() => setShowForm(true)}>+ מתכון חדש</button>
          )}
        </div>

        <div className="search-section">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="חיפוש מתכון..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">🔍</button>
            {searchQuery && (
              <button type="button" className="clear-search" onClick={clearSearch}>
                ✕
              </button>
            )}
          </form>
          {isAuthenticated && (
            <label className="my-recipes-checkbox">
              <input
                type="checkbox"
                checked={showMyRecipesOnly}
                onChange={(e) => setShowMyRecipesOnly(e.target.checked)}
              />
              <span>המתכונים שלי בלבד</span>
            </label>
          )}
        </div>

        {searchQuery && (
          <p className="search-results-info">
            תוצאות חיפוש עבור "{searchQuery}" ({recipes.length} מתכונים)
          </p>
        )}

        {loading ? (
          <p className="message">טוען...</p>
        ) : (() => {
          const filteredRecipes = showMyRecipesOnly && user
            ? recipes.filter(r => r.userId === user.userId)
            : recipes
          return filteredRecipes.length === 0 ? (
            <p className="message">
              {showMyRecipesOnly ? 'אין לך מתכונים עדיין.' : searchQuery ? 'לא נמצאו מתכונים. נסה חיפוש אחר.' : 'אין עדיין מתכונים. הוסף את המתכון הראשון שלך!'}
            </p>
          ) : (
            <div className="recipe-grid">
              {filteredRecipes.map((recipe) => (
              <div
                key={recipe._id}
                className="recipe-card"
                onClick={() => selectRecipe(recipe)}
              >
                {recipe.thumbnailId && (
                  <div className="card-image">
                    <img src={`${API_URL}/images/${recipe.thumbnailId}`} alt={recipe.title} />
                  </div>
                )}
                <div className="card-content">
                  <h3>{recipe.title}</h3>
                  {recipe.description && (
                    <p className="card-description">{recipe.description}</p>
                  )}
                  <div className="card-meta">
                    {recipe.cookTime && <span>⏱️ {recipe.cookTime} דק׳</span>}
                    {recipe.origin && <span>🌍 {recipe.origin}</span>}
                    {recipe.difficulty && (
                      <DifficultyMeter level={recipe.difficulty} />
                    )}
                    {recipe.spiciness && (
                      <SpicinessMeter level={recipe.spiciness} />
                    )}
                  </div>
                  <div className="card-tags">
                    {recipe.category && (
                      <span className="category">{recipe.category}</span>
                    )}
                    {recipe.isVegan && <span className="dietary-tag vegan">🌱</span>}
                    {recipe.isVegetarian && <span className="dietary-tag vegetarian">🥬</span>}
                    {recipe.isPrivate && <span className="dietary-tag private">🔒</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        })()}
      </div>
    </div>
  )
}

export default Home
