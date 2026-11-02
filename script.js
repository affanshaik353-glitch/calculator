const demoMemories = [
  {
    id: 'sample-1', title: 'The long way home', caption: 'Nobody was in a hurry.', location: 'The hills', memory_date: '2025-08-03', category: 'places',
    image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-2', title: 'Everyone stayed late', caption: 'One more song turned into five.', location: 'At ours', memory_date: '2025-06-14', category: 'people',
    image_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-3', title: 'A very small victory', caption: 'Found the blue door after all.', location: 'Old town', memory_date: '2025-04-22', category: 'small-things',
    image_url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-4', title: 'Salt in our hair', caption: 'The tide kept all our secrets.', location: 'By the water', memory_date: '2024-12-29', category: 'people',
    image_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-5', title: 'Before the city woke', caption: 'Coffee, quiet, and nowhere to be.', location: 'A Sunday morning', memory_date: '2024-10-06', category: 'small-things',
    image_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'sample-6', title: 'Somewhere above the clouds', caption: 'We missed the turn. It was perfect.', location: 'Northbound', memory_date: '2024-07-18', category: 'places',
    image_url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85'
  }
];

const elements = {
  adminButton: document.querySelector('#admin-toggle'),
  adminLabel: document.querySelector('#admin-label'),
  adminTools: document.querySelector('#admin-tools'),
  addMemoryButton: document.querySelector('#add-memory'),
  gallery: document.querySelector('#gallery-grid'),
  galleryStatus: document.querySelector('#gallery-status'),
  emptyState: document.querySelector('#empty-state'),
  memoryCount: document.querySelector('#memory-count'),
  loginDialog: document.querySelector('#login-dialog'),
  loginForm: document.querySelector('#login-form'),
  loginNote: document.querySelector('#login-note'),
  loginMessage: document.querySelector('#login-message'),
  uploadDialog: document.querySelector('#upload-dialog'),
  uploadForm: document.querySelector('#upload-form'),
  uploadMessage: document.querySelector('#upload-message'),
  photoDialog: document.querySelector('#photo-dialog'),
  photoImage: document.querySelector('#photo-viewer-image'),
  photoMeta: document.querySelector('#photo-viewer-meta'),
  photoTitle: document.querySelector('#photo-viewer-title'),
  photoNote: document.querySelector('#photo-viewer-note')
};

const config = window.MEMORIES_CONFIG ?? {};
const configured = Boolean(config.supabaseUrl && config.publishableKey);
const supabaseClient = configured && window.supabase?.createClient
  ? window.supabase.createClient(config.supabaseUrl, config.publishableKey)
  : null;
const bucketName = 'memories';
let memories = [];
let activeFilter = 'all';
let currentUser = null;
let isAdmin = false;
let adminCheck = 0;

function categoryName(category) {
  return ({ people: 'People', places: 'Places', 'small-things': 'Small things' })[category] ?? 'Memory';
}

function formatMemoryDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}

function setMessage(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle('is-success', success);
}

function makeMemoryCard(memory, index) {
  const article = document.createElement('article');
  article.className = 'memory-card';
  article.style.setProperty('--card-index', String(index));

  const media = document.createElement('div');
  media.className = 'memory-card__media';

  const openButton = document.createElement('button');
  openButton.className = 'memory-card__open';
  openButton.type = 'button';
  openButton.setAttribute('aria-label', `Open ${memory.title}`);

  const image = document.createElement('img');
  image.className = 'memory-card__image';
  image.src = memory.image_url;
  image.alt = memory.title;
  image.loading = 'lazy';
  image.decoding = 'async';

  const category = document.createElement('span');
  category.className = 'memory-card__category';
  category.textContent = categoryName(memory.category);
  openButton.append(image, category);
  openButton.addEventListener('click', () => openPhoto(memory));
  media.append(openButton);

  if (isAdmin && memory.id) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-memory';
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', `Delete ${memory.title}`);
    deleteButton.title = 'Delete memory';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => deleteMemory(memory));
    media.append(deleteButton);
  }

  const meta = document.createElement('div');
  meta.className = 'memory-card__meta';
  const location = document.createElement('span');
  location.textContent = memory.location || 'Somewhere lovely';
  const date = document.createElement('time');
  date.textContent = formatMemoryDate(memory.memory_date);
  if (memory.memory_date) date.dateTime = memory.memory_date;
  meta.append(location, date);

  const title = document.createElement('h3');
  title.textContent = memory.title;
  const caption = document.createElement('p');
  caption.className = 'memory-card__caption';
  caption.textContent = memory.caption || '';

  article.append(media, meta, title, caption);
  return article;
}

function renderMemories() {
  const visibleMemories = activeFilter === 'all'
    ? memories
    : memories.filter((memory) => memory.category === activeFilter);
  elements.gallery.replaceChildren(...visibleMemories.map(makeMemoryCard));
  elements.emptyState.hidden = visibleMemories.length > 0;
  elements.memoryCount.textContent = String(memories.length).padStart(2, '0');
  const allCount = document.querySelector('[data-filter="all"] span');
  if (allCount) allCount.textContent = String(memories.length).padStart(2, '0');
}

function openPhoto(memory) {
  elements.photoImage.src = memory.image_url;
  elements.photoImage.alt = memory.title;
  elements.photoMeta.textContent = [memory.location, formatMemoryDate(memory.memory_date)].filter(Boolean).join(' · ');
  elements.photoTitle.textContent = memory.title;
  elements.photoNote.textContent = memory.caption || '';
  elements.photoDialog.showModal();
}

async function loadMemories() {
  if (!supabaseClient) {
    memories = demoMemories;
    renderMemories();
    setMessage(elements.galleryStatus, 'Preview collection · sample photographs');
    return;
  }

  elements.galleryStatus.textContent = 'Opening the archive…';
  const { data, error } = await supabaseClient
    .from('memories')
    .select('id, title, caption, location, category, memory_date, image_path, created_at')
    .order('memory_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    memories = [];
    renderMemories();
    elements.galleryStatus.textContent = 'The archive could not be reached. Check the Supabase setup.';
    console.error('Could not load memories:', error);
    return;
  }

  memories = data.map((memory) => ({
    ...memory,
    image_url: supabaseClient.storage.from(bucketName).getPublicUrl(memory.image_path).data.publicUrl
  }));
  renderMemories();
  elements.galleryStatus.textContent = memories.length
    ? `${memories.length} ${memories.length === 1 ? 'photograph' : 'photographs'} in the archive`
    : 'A quiet archive, ready for its first photograph.';
}

function setLoginEnabled(enabled) {
  elements.loginForm.querySelectorAll('input, .submit-button').forEach((input) => {
    input.disabled = !enabled;
  });
}

async function checkAdmin(user, showDenied = false) {
  if (!supabaseClient || !user) return false;
  const checkId = ++adminCheck;
  const { data, error } = await supabaseClient.rpc('is_memory_admin');
  if (checkId !== adminCheck) return false;

  if (error) {
    isAdmin = false;
    currentUser = user;
    elements.adminTools.hidden = true;
    elements.adminLabel.textContent = 'Admin';
    if (showDenied) setMessage(elements.loginMessage, 'Admin access could not be verified. Check the Supabase setup.');
    console.error('Could not verify admin access:', error);
    return false;
  }

  if (data !== true) {
    isAdmin = false;
    currentUser = null;
    elements.adminTools.hidden = true;
    elements.adminLabel.textContent = 'Admin';
    await supabaseClient.auth.signOut({ scope: 'local' });
    if (showDenied) setMessage(elements.loginMessage, 'This account does not have archive admin access.');
    return false;
  }

  currentUser = user;
  isAdmin = true;
  elements.adminTools.hidden = false;
  elements.adminLabel.textContent = 'Sign out';
  elements.loginDialog.close();
  await loadMemories();
  return true;
}

async function deleteMemory(memory) {
  if (!isAdmin || !supabaseClient || !window.confirm(`Remove “${memory.title}” from the archive?`)) return;
  elements.galleryStatus.textContent = 'Removing memory…';
  const { error: rowError } = await supabaseClient.from('memories').delete().eq('id', memory.id);
  if (rowError) {
    elements.galleryStatus.textContent = 'This memory could not be removed.';
    console.error('Could not delete memory:', rowError);
    return;
  }

  const { error: fileError } = await supabaseClient.storage.from(bucketName).remove([memory.image_path]);
  await loadMemories();
  if (fileError) {
    elements.galleryStatus.textContent = 'Memory removed; its photo file may need cleanup in Supabase Storage.';
    console.error('Could not delete stored photo:', fileError);
  }
}

async function uploadMemory(event) {
  event.preventDefault();
  if (!isAdmin || !supabaseClient) return;

  const formData = new FormData(elements.uploadForm);
  const file = formData.get('photo');
  if (!(file instanceof File) || !file.size) {
    setMessage(elements.uploadMessage, 'Choose a photo first.');
    return;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    setMessage(elements.uploadMessage, 'Choose a JPG, PNG, or WebP image under 10 MB.');
    return;
  }

  const submitButton = elements.uploadForm.querySelector('.submit-button');
  submitButton.disabled = true;
  setMessage(elements.uploadMessage, 'Saving this memory…');
  const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[file.type];
  const imagePath = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabaseClient.storage.from(bucketName).upload(imagePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    submitButton.disabled = false;
    setMessage(elements.uploadMessage, 'The photo could not be uploaded. Check your connection and storage policies.');
    console.error('Could not upload photo:', uploadError);
    return;
  }

  const { error: rowError } = await supabaseClient.from('memories').insert({
    title: String(formData.get('title')).trim(),
    caption: String(formData.get('caption') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    category: String(formData.get('category')),
    memory_date: String(formData.get('memory_date')) || new Date().toISOString().slice(0, 10),
    image_path: imagePath,
    created_by: currentUser.id
  });

  if (rowError) {
    await supabaseClient.storage.from(bucketName).remove([imagePath]);
    submitButton.disabled = false;
    setMessage(elements.uploadMessage, 'The photo uploaded, but its memory could not be saved.');
    console.error('Could not save memory:', rowError);
    return;
  }

  elements.uploadForm.reset();
  submitButton.disabled = false;
  elements.uploadDialog.close();
  await loadMemories();
}

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-selected', String(selected));
    });
    renderMemories();
  });
});

document.querySelector('.filters').addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const filters = [...document.querySelectorAll('.filter')];
  const currentIndex = filters.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  event.preventDefault();
  const nextIndex = event.key === 'Home' ? 0
    : event.key === 'End' ? filters.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : filters.length - 1)) % filters.length;
  filters[nextIndex].focus();
  filters[nextIndex].click();
});

elements.adminButton.addEventListener('click', async () => {
  if (isAdmin && supabaseClient) {
    await supabaseClient.auth.signOut({ scope: 'local' });
    return;
  }
  const enabled = Boolean(supabaseClient);
  setLoginEnabled(enabled);
  elements.loginNote.textContent = enabled
    ? 'Sign in with the archive admin account.'
    : 'Connect a Supabase project to enable private admin access.';
  setMessage(elements.loginMessage, '');
  elements.loginDialog.showModal();
});

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) return;
  const submitButton = elements.loginForm.querySelector('.submit-button');
  submitButton.disabled = true;
  setMessage(elements.loginMessage, 'Checking your account…');
  const formData = new FormData(elements.loginForm);
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: String(formData.get('email')).trim(),
    password: String(formData.get('password'))
  });
  submitButton.disabled = false;
  if (error) {
    setMessage(elements.loginMessage, 'Sign-in failed. Check the email and password.');
    return;
  }
  const allowed = await checkAdmin(data.user, true);
  if (!allowed) elements.loginForm.reset();
});

elements.addMemoryButton.addEventListener('click', () => {
  if (!isAdmin) return;
  elements.uploadForm.reset();
  elements.uploadForm.elements.memory_date.value = new Date().toISOString().slice(0, 10);
  setMessage(elements.uploadMessage, '');
  elements.uploadDialog.showModal();
});
elements.uploadForm.addEventListener('submit', uploadMemory);

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      currentUser = null;
      isAdmin = false;
      elements.adminTools.hidden = true;
      elements.adminLabel.textContent = 'Admin';
      void loadMemories();
      return;
    }
    window.setTimeout(() => checkAdmin(session.user), 0);
  });
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session?.user) void checkAdmin(data.session.user);
    else void loadMemories();
  });
} else {
  void loadMemories();
}
