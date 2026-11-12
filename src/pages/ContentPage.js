import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  ButtonGroup,
  Avatar,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
} from '@mui/material';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import DraftsRoundedIcon from '@mui/icons-material/DraftsRounded';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Sidebar from '../components/Sidebar';
import { fetchContents, publishContent, updateContent, deleteContent } from '../services/onboardingService';

const resolveContentImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('/uploads/contents/')) {
    const filename = url.split('/uploads/contents/').pop();
    const backendHost = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api')
      .replace(/\/api\/?$/, '');
    return `${backendHost}/uploads/contents/${filename}`;
  }
  return url;
};

const ContentPage = () => {
  const [liveItems, setLiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Form Fields
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Delete Confirmation Dialog State
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null, loading: false });

  // Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const loadContents = useCallback(async (filter = statusFilter) => {
    setLoading(true);
    try {
      const data = await fetchContents(filter);
      setLiveItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading contents:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadContents(statusFilter);
  }, [loadContents, statusFilter]);

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(liveItems.length / itemsPerPage) || 1;
  const paginatedItems = liveItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (targetStatus = 'published') => {
    if (!title.trim()) {
      setToast({ open: true, message: 'Please enter a title for the health tip.', severity: 'warning' });
      return;
    }

    if (targetStatus === 'published') setPublishing(true);
    else setSavingDraft(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('tag', tag.trim() || 'Health tip');
      formData.append('excerpt', excerpt.trim() || title.trim());
      formData.append('status', targetStatus);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await publishContent(formData);
      setToast({
        open: true,
        message: targetStatus === 'draft' ? 'Saved as draft.' : 'Health tip published to patient feed!',
        severity: 'success',
      });
      setTitle('');
      setTag('');
      setExcerpt('');
      handleRemoveImage();
      loadContents(statusFilter);
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to save content.', severity: 'error' });
    } finally {
      setPublishing(false);
      setSavingDraft(false);
    }
  };

  const handlePublishDraft = async (item) => {
    try {
      await updateContent(item.id, { status: 'published' });
      setToast({ open: true, message: `"${item.title}" published to live feed!`, severity: 'success' });
      loadContents(statusFilter);
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to publish draft.', severity: 'error' });
    }
  };

  const handleOpenDelete = (item) => {
    setDeleteDialog({ open: true, item, loading: false });
  };

  const handleCloseDelete = () => {
    if (!deleteDialog.loading) {
      setDeleteDialog({ open: false, item: null, loading: false });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.item) return;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await deleteContent(deleteDialog.item.id);
      setLiveItems((prev) => prev.filter((i) => i.id !== deleteDialog.item.id));
      setToast({ open: true, message: 'Content item deleted.', severity: 'info' });
      handleCloseDelete();
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to delete content.', severity: 'error' });
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          gap: 2.5,
        }}
      >
          {/* Header Bar */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              px: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Box>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Content
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 0.25,
                }}
              >
                Publish tips that appear in the patient For You feed.
              </Typography>
            </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton
                  onClick={loadContents}
                  size="small"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    bgcolor: '#ffffff',
                  }}
                  title="Refresh For You contents"
                >
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
                <Chip
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                      }}
                    >
                      AT
                    </Avatar>
                  }
                  label="Alex Tan"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderColor: 'divider',
                    bgcolor: '#ffffff',
                    py: 2,
                    px: 0.5,
                    borderRadius: 2,
                  }}
                />
              </Box>
          </Paper>

          {/* 2-Column Split Content Area */}
          <Box
            sx={{
              display: 'flex',
              flexGrow: 1,
              gap: 2.5,
              alignItems: 'flex-start',
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            {/* Left Card: Publish health tip */}
            <Paper
              elevation={1}
              sx={{
                flex: 1,
                width: { xs: '100%', md: '50%' },
                borderRadius: 2,
                p: 3,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 2.5,
                }}
              >
                Publish health tip
              </Typography>

              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave('published');
                }}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                {/* Title */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.75,
                      fontSize: '0.875rem',
                    }}
                  >
                    Title
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Hydration after laser resurfacing"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: '#ffffff',
                      },
                    }}
                  />
                </Box>

                {/* Tag */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.75,
                      fontSize: '0.875rem',
                    }}
                  >
                    Tag
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Health tip"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: '#ffffff',
                      },
                    }}
                  />
                </Box>

                {/* Excerpt */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.75,
                      fontSize: '0.875rem',
                    }}
                  >
                    Excerpt
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short member-facing note that will appear in For You."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: '#ffffff',
                      },
                    }}
                  />
                </Box>

                {/* Image Upload */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.75,
                      fontSize: '0.875rem',
                    }}
                  >
                    Article Image
                  </Typography>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />

                  {imagePreview ? (
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        maxHeight: 180,
                        bgcolor: '#f8fafc',
                      }}
                    >
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Preview"
                        sx={{
                          width: '100%',
                          height: 160,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleRemoveImage}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(15, 23, 42, 0.7)',
                          color: '#ffffff',
                          '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.9)' },
                        }}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: 2,
                        p: 2.5,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: '#f8fafc',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#0f766e',
                          bgcolor: '#f0fdfa',
                        },
                      }}
                    >
                      <AddPhotoAlternateRoundedIcon sx={{ fontSize: 32, color: '#0f766e', mb: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        Click to upload an image
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        JPG, PNG, WebP up to 5MB
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Action Buttons: Publish + Save Draft */}
                <Box sx={{ pt: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => handleSave('published')}
                    disabled={publishing || savingDraft}
                    startIcon={
                      publishing ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <NearMeRoundedIcon sx={{ fontSize: 18 }} />
                      )
                    }
                    sx={{
                      flex: 1,
                      minWidth: 180,
                      bgcolor: '#0f766e',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      px: 2.5,
                      py: 1.1,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      boxShadow: '0 1px 2px rgba(15, 118, 110, 0.2)',
                      '&:hover': {
                        bgcolor: '#0d5f58',
                        boxShadow: '0 2px 4px rgba(15, 118, 110, 0.3)',
                      },
                    }}
                  >
                    {publishing ? 'Publishing...' : 'Publish to patient feed'}
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => handleSave('draft')}
                    disabled={publishing || savingDraft}
                    startIcon={
                      savingDraft ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <DraftsRoundedIcon sx={{ fontSize: 18 }} />
                      )
                    }
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      px: 2.5,
                      py: 1.1,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      bgcolor: '#ffffff',
                      '&:hover': {
                        bgcolor: '#f8fafc',
                        borderColor: '#94a3b8',
                      },
                    }}
                  >
                    {savingDraft ? 'Saving...' : 'Save Draft'}
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Right Card: Live on For You */}
            <Paper
              elevation={1}
              sx={{
                flex: 1,
                width: { xs: '100%', md: '50%' },
                borderRadius: 2,
                p: 3,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2.5,
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  Articles & Tips ({liveItems.length})
                </Typography>

                {/* Status Filter Toggle */}
                <ButtonGroup
                  size="small"
                  variant="outlined"
                  sx={{
                    bgcolor: '#f8fafc',
                    borderRadius: 1.5,
                    p: 0.3,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Published', value: 'published' },
                    { label: 'Drafts', value: 'draft' },
                  ].map((filter) => {
                    const active = statusFilter === filter.value;
                    return (
                      <Button
                        key={filter.value}
                        onClick={() => handleFilterChange(filter.value)}
                        sx={{
                          border: 'none !important',
                          borderRadius: '6px !important',
                          px: 1.5,
                          py: 0.4,
                          fontSize: '0.75rem',
                          fontWeight: active ? 700 : 500,
                          bgcolor: active ? '#0f766e !important' : 'transparent',
                          color: active ? '#ffffff !important' : '#64748b',
                        }}
                      >
                        {filter.label}
                      </Button>
                    );
                  })}
                </ButtonGroup>
              </Box>

              {loading ? (
                <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={28} sx={{ color: '#0f766e' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading feed...
                  </Typography>
                </Box>
              ) : liveItems.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {statusFilter === 'draft'
                      ? 'No drafts saved. Click "Save Draft" to create one.'
                      : 'No articles match this filter.'}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Stack spacing={2}>
                    {paginatedItems.map((item) => (
                      <Box
                        key={item.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: item.status === 'draft' ? '#fbfcfe' : '#f8fafc',
                        border: item.status === 'draft' ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      {item.image_url ? (
                        <Box
                          component="img"
                          src={resolveContentImageUrl(item.image_url)}
                          alt={item.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=300&q=80';
                          }}
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 1.5,
                            objectFit: 'cover',
                            flexShrink: 0,
                            bgcolor: '#cbd5e1',
                          }}
                        />
                      ) : null}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#0d9488',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {item.tag}
                            </Typography>
                            {item.status === 'draft' ? (
                              <Chip
                                label="DRAFT"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  borderRadius: 1,
                                }}
                              />
                            ) : (
                              <Chip
                                label="LIVE"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  borderRadius: 1,
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {item.status === 'draft' ? (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handlePublishDraft(item)}
                                startIcon={<PublishRoundedIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: '#0f766e',
                                  py: 0.25,
                                  px: 1,
                                  textTransform: 'none',
                                  '&:hover': { bgcolor: '#f0fdfa' },
                                }}
                              >
                                Publish
                              </Button>
                            ) : null}

                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(item)}
                              sx={{
                                color: '#94a3b8',
                                p: 0.5,
                                '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' },
                              }}
                              title="Delete content"
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </Box>

                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: 'text.primary',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            lineHeight: 1.35,
                            mb: 0.5,
                          }}
                        >
                          {item.title}
                        </Typography>

                        {item.excerpt ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#64748b',
                              fontSize: '0.8125rem',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.excerpt}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  ))}
                </Stack>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2.5,
                      pt: 2,
                      borderTop: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Showing {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(currentPage * itemsPerPage, liveItems.length)} of {liveItems.length} articles
                    </Typography>

                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(e, val) => setCurrentPage(val)}
                      size="small"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 1.5,
                          fontWeight: 600,
                        },
                        '& .Mui-selected': {
                          bgcolor: '#0f766e !important',
                          color: '#ffffff',
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
          </Box>
        </Box>

        {/* Delete Confirmation Popup Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleCloseDelete}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
              width: '100%',
              maxWidth: 440,
            },
          }}
        >
          <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningAmberRoundedIcon />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
              Delete Article
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete{' '}
              <strong>"{deleteDialog.item?.title}"</strong>?
              {deleteDialog.item?.status === 'published'
                ? ' This article will be removed from all patients’ For You feeds immediately.'
                : ' This draft will be discarded permanently.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              onClick={handleCloseDelete}
              disabled={deleteDialog.loading}
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748b',
                borderColor: '#cbd5e1',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteDialog.loading}
              variant="contained"
              color="error"
              startIcon={deleteDialog.loading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#dc2626',
                '&:hover': { bgcolor: '#b91c1c' },
              }}
            >
              {deleteDialog.loading ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            severity={toast.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  };

export default ContentPage;

