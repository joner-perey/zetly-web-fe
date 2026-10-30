import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import Sidebar from '../components/Sidebar';

const initialLiveItems = [
  {
    id: 1,
    tag: 'Medical tourism',
    title: 'Plastic surgery in Phuket',
  },
  {
    id: 2,
    tag: 'Aesthetics',
    title: 'Laser rejuvenation, without the guesswork',
  },
  {
    id: 3,
    tag: 'How-to',
    title: 'What a cashless visit looks like',
  },
  {
    id: 4,
    tag: 'Wellness',
    title: 'Recovery week, done properly',
  },
];

const ContentPage = () => {
  const [liveItems, setLiveItems] = useState(initialLiveItems);
  const [title, setTitle] = useState('Hydration after laser resurfacing');
  const [tag, setTag] = useState('Health tip');
  const [excerpt, setExcerpt] = useState('');

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem = {
      id: Date.now(),
      tag: tag.trim() || 'Health tip',
      title: title.trim(),
    };

    setLiveItems([newItem, ...liveItems]);
    setTitle('');
    setTag('');
    setExcerpt('');
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

              <Box component="form" onSubmit={handlePublish} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                    rows={4}
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

                {/* Submit Button */}
                <Box sx={{ pt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<NearMeRoundedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: '#0f766e',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      px: 2.5,
                      py: 1,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      boxShadow: '0 1px 2px rgba(15, 118, 110, 0.2)',
                      '&:hover': {
                        bgcolor: '#0d5f58',
                        boxShadow: '0 2px 4px rgba(15, 118, 110, 0.3)',
                      },
                    }}
                  >
                    Publish to patient feed
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
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 2.5,
                }}
              >
                Live on For You
              </Typography>

              <Stack spacing={1.75}>
                {liveItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      px: 2.25,
                      borderRadius: 1.5,
                      bgcolor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: '#f1f5f9',
                        borderColor: '#e2e8f0',
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#0d9488',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {item.tag}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  };

export default ContentPage;

