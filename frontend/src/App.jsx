import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  Tag as TagIcon, 
  Edit3, 
  Check, 
  X, 
  Layout, 
  ListTodo, 
  UserPlus, 
  AlertCircle 
} from 'lucide-react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function App() {
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [boardDetails, setBoardDetails] = useState(null);
  const [tags, setTags] = useState([]);
  const [members, setMembers] = useState([]);
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'board', 'list', 'card', 'tag', 'member', 'edit-card'
  const [selectedCard, setSelectedCard] = useState(null);

  // Form states
  const [boardForm, setBoardForm] = useState({ name: '' });
  const [listForm, setListForm] = useState({ name: '', board_id: '' });
  const [cardForm, setCardForm] = useState({ 
    title: '', 
    description: '', 
    due_date: '', 
    kanban_list_id: '',
    selectedTags: [],
    selectedMembers: []
  });
  const [tagForm, setTagForm] = useState({ name: '', color: '#6366f1' });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', avatar_url: '' });

  // Drag and Drop state
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchBoards();
    fetchTags();
    fetchMembers();
  }, []);

  // Fetch board details when currentBoard changes
  useEffect(() => {
    if (currentBoard) {
      fetchBoardDetails(currentBoard.id);
    } else {
      setBoardDetails(null);
    }
  }, [currentBoard]);

  const fetchBoards = async () => {
    try {
      const res = await fetch(`${API_BASE}/boards`);
      const data = await res.json();
      setBoards(data);
      if (data.length > 0 && !currentBoard) {
        setCurrentBoard(data[0]);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
    }
  };

  const fetchBoardDetails = async (boardId) => {
    try {
      const res = await fetch(`${API_BASE}/boards/${boardId}`);
      const data = await res.json();
      setBoardDetails(data);
    } catch (err) {
      console.error("Error fetching board details:", err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_BASE}/tags`);
      const data = await res.json();
      setTags(data);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/members`);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  // CRUD handlers
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardForm)
      });
      const data = await res.json();
      setBoards([...boards, data]);
      setCurrentBoard(data);
      setBoardForm({ name: '' });
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm("Are you sure you want to delete this board and all its lists?")) return;
    try {
      await fetch(`${API_BASE}/boards/${boardId}`, { method: 'DELETE' });
      const updated = boards.filter(b => b.id !== boardId);
      setBoards(updated);
      if (updated.length > 0) {
        setCurrentBoard(updated[0]);
      } else {
        setCurrentBoard(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...listForm, board_id: currentBoard.id })
      });
      const data = await res.json();
      if (boardDetails) {
        setBoardDetails({
          ...boardDetails,
          kanban_lists: [...boardDetails.kanban_lists, { ...data, cards: [] }]
        });
      }
      setListForm({ name: '', board_id: '' });
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this list and all its cards?")) return;
    try {
      await fetch(`${API_BASE}/lists/${listId}`, { method: 'DELETE' });
      if (boardDetails) {
        setBoardDetails({
          ...boardDetails,
          kanban_lists: boardDetails.kanban_lists.filter(l => l.id !== listId)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      // 1. Create Card
      const cardRes = await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanban_list_id: cardForm.kanban_list_id,
          title: cardForm.title,
          description: cardForm.description,
          due_date: cardForm.due_date || null
        })
      });
      let cardData = await cardRes.json();

      // 2. Sync Tags
      if (cardForm.selectedTags.length > 0) {
        const tagRes = await fetch(`${API_BASE}/cards/${cardData.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: cardForm.selectedTags })
        });
        cardData = await tagRes.json();
      }

      // 3. Sync Members
      if (cardForm.selectedMembers.length > 0) {
        const memberRes = await fetch(`${API_BASE}/cards/${cardData.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: cardForm.selectedMembers })
        });
        cardData = await memberRes.json();
      }

      // Update boardDetails local state
      if (boardDetails) {
        const updatedLists = boardDetails.kanban_lists.map(list => {
          if (list.id === cardForm.kanban_list_id) {
            return { ...list, cards: [...list.cards, cardData] };
          }
          return list;
        });
        setBoardDetails({ ...boardDetails, kanban_lists: updatedLists });
      }

      setCardForm({
        title: '',
        description: '',
        due_date: '',
        kanban_list_id: '',
        selectedTags: [],
        selectedMembers: []
      });
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditCard = (card) => {
    setSelectedCard(card);
    setCardForm({
      title: card.title,
      description: card.description || '',
      due_date: card.due_date ? card.due_date.substring(0, 16) : '',
      kanban_list_id: card.kanban_list_id,
      selectedTags: card.tags.map(t => t.id),
      selectedMembers: card.members.map(m => m.id)
    });
    setActiveModal('edit-card');
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    try {
      // 1. Update card info
      const cardRes = await fetch(`${API_BASE}/cards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanban_list_id: cardForm.kanban_list_id,
          title: cardForm.title,
          description: cardForm.description,
          due_date: cardForm.due_date || null
        })
      });
      let cardData = await cardRes.json();

      // 2. Sync tags
      const tagRes = await fetch(`${API_BASE}/cards/${selectedCard.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: cardForm.selectedTags })
      });
      cardData = await tagRes.json();

      // 3. Sync members
      const memberRes = await fetch(`${API_BASE}/cards/${selectedCard.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: cardForm.selectedMembers })
      });
      cardData = await memberRes.json();

      // Re-fetch board details to sync state completely
      fetchBoardDetails(currentBoard.id);

      setActiveModal(null);
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      await fetch(`${API_BASE}/cards/${cardId}`, { method: 'DELETE' });
      if (boardDetails) {
        const updatedLists = boardDetails.kanban_lists.map(list => ({
          ...list,
          cards: list.cards.filter(c => c.id !== cardId)
        }));
        setBoardDetails({ ...boardDetails, kanban_lists: updatedLists });
      }
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagForm)
      });
      const data = await res.json();
      setTags([...tags, data]);
      setTagForm({ name: '', color: '#6366f1' });
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      const avatar = memberForm.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberForm.name)}`;
      const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...memberForm, avatar_url: avatar })
      });
      const data = await res.json();
      setMembers([...members, data]);
      setMemberForm({ name: '', email: '', avatar_url: '' });
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop logic
  const handleDragStart = (e, cardId) => {
    setDraggingCardId(cardId);
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e, listId) => {
    e.preventDefault();
    setDragOverListId(listId);
  };

  const handleDragLeave = () => {
    setDragOverListId(null);
  };

  const handleDrop = async (e, targetListId) => {
    e.preventDefault();
    const cardId = parseInt(e.dataTransfer.getData('text/plain'));
    setDraggingCardId(null);
    setDragOverListId(null);

    if (!cardId || !boardDetails) return;

    // Find the card being dragged
    let draggedCard = null;
    let sourceListId = null;
    boardDetails.kanban_lists.forEach(l => {
      const found = l.cards.find(c => c.id === cardId);
      if (found) {
        draggedCard = found;
        sourceListId = l.id;
      }
    });

    if (!draggedCard || sourceListId === targetListId) return;

    // Optimistically update local UI state
    const sourceList = boardDetails.kanban_lists.find(l => l.id === sourceListId);
    const targetList = boardDetails.kanban_lists.find(l => l.id === targetListId);
    
    const updatedSourceCards = sourceList.cards.filter(c => c.id !== cardId);
    const updatedTargetCards = [...targetList.cards, { ...draggedCard, kanban_list_id: targetListId }];

    const updatedLists = boardDetails.kanban_lists.map(l => {
      if (l.id === sourceListId) return { ...l, cards: updatedSourceCards };
      if (l.id === targetListId) return { ...l, cards: updatedTargetCards };
      return l;
    });

    setBoardDetails({ ...boardDetails, kanban_lists: updatedLists });

    // Sync move with backend
    try {
      await fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanban_list_id: targetListId,
          position: updatedTargetCards.length - 1
        })
      });
    } catch (err) {
      console.error("Failed to sync card position:", err);
      // Re-fetch board details on error to sync with backend
      fetchBoardDetails(currentBoard.id);
    }
  };

  const isOverdue = (dateStr, listName) => {
    if (!dateStr || listName.toLowerCase() === 'done') return false;
    return new Date(dateStr) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand-section">
          <Layout className="accent-primary" size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="brand-title">KanbanFlow</h1>
        </div>

        <div className="board-controls">
          <select 
            className="select-board"
            value={currentBoard ? currentBoard.id : ''}
            onChange={(e) => {
              const selected = boards.find(b => b.id === parseInt(e.target.value));
              setCurrentBoard(selected);
            }}
          >
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {currentBoard && (
            <button className="action-icon-btn" onClick={() => handleDeleteBoard(currentBoard.id)} title="Delete Current Board">
              <Trash2 size={18} style={{ color: 'var(--accent-danger)' }} />
            </button>
          )}

          <button className="btn-secondary" onClick={() => setActiveModal('board')}>
            <Plus size={16} /> New Board
          </button>

          <button className="btn-secondary" onClick={() => setActiveModal('tag')}>
            <TagIcon size={16} /> Tags
          </button>

          <button className="btn-secondary" onClick={() => setActiveModal('member')}>
            <UserPlus size={16} /> Add Member
          </button>
        </div>
      </nav>

      {/* Board Canvas */}
      <main className="board-canvas scroller">
        {boardDetails && boardDetails.kanban_lists.map(list => (
          <div 
            key={list.id} 
            className={`list-column ${dragOverListId === list.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, list.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, list.id)}
          >
            {/* List Header */}
            <div className="list-header">
              <div className="list-title-section">
                <h3 className="list-title">{list.name}</h3>
                <span className="list-badge">{list.cards.length}</span>
              </div>
              <div className="list-actions">
                <button className="action-icon-btn" onClick={() => handleDeleteList(list.id)} title="Delete List">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Cards Stack */}
            <div className="cards-container scroller">
              {list.cards.map(card => (
                <div 
                  key={card.id}
                  className={`card-item ${draggingCardId === card.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onClick={() => handleOpenEditCard(card)}
                >
                  <div className="card-tags">
                    {card.tags && card.tags.map(t => (
                      <span key={t.id} className="badge-tag" style={{ backgroundColor: t.color }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <h4 className="card-title">{card.title}</h4>
                  {card.description && <p className="card-description">{card.description}</p>}
                  
                  <div className="card-footer">
                    <div className={`card-date ${isOverdue(card.due_date, list.name) ? 'overdue' : ''}`}>
                      {card.due_date && (
                        <>
                          {isOverdue(card.due_date, list.name) ? <AlertCircle size={12} /> : <Calendar size={12} />}
                          <span>{formatDate(card.due_date)}</span>
                        </>
                      )}
                    </div>
                    <div className="card-members">
                      {card.members && card.members.map(m => (
                        <img 
                          key={m.id} 
                          className="member-avatar" 
                          src={m.avatar_url} 
                          alt={m.name} 
                          title={m.name} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Card Button */}
            <button 
              className="add-card-trigger"
              onClick={() => {
                setCardForm({ ...cardForm, kanban_list_id: list.id });
                setActiveModal('card');
              }}
            >
              <Plus size={14} /> Add Card
            </button>
          </div>
        ))}

        {currentBoard && (
          <button className="add-column-trigger" onClick={() => setActiveModal('list')}>
            <Plus size={18} /> Add List
          </button>
        )}
      </main>

      {/* ========================================== */}
      {/* Modals                                     */}
      {/* ========================================== */}
      
      {/* Create Board Modal */}
      {activeModal === 'board' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Board</h2>
              <button className="action-icon-btn" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label className="form-label">Board Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={boardForm.name}
                  onChange={(e) => setBoardForm({ name: e.target.value })}
                  placeholder="e.g. Acme App Redesign"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Board</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {activeModal === 'list' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create List</h2>
              <button className="action-icon-btn" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label className="form-label">List Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={listForm.name}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                  placeholder="e.g. QA Review"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Create List</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {activeModal === 'card' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Card</h2>
              <button className="action-icon-btn" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCard}>
              <div className="form-group">
                <label className="form-label">Card Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={cardForm.title}
                  onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                  placeholder="Task title..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  value={cardForm.description}
                  onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                  placeholder="Add details..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={cardForm.due_date}
                  onChange={(e) => setCardForm({ ...cardForm, due_date: e.target.value })}
                />
              </div>

              {/* Tag Selector */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tag-selection-grid">
                  {tags.map(t => (
                    <span 
                      key={t.id} 
                      className={`selectable-tag-pill ${cardForm.selectedTags.includes(t.id) ? 'selected' : ''}`}
                      style={{ backgroundColor: t.color }}
                      onClick={() => {
                        const exists = cardForm.selectedTags.includes(t.id);
                        const selected = exists 
                          ? cardForm.selectedTags.filter(id => id !== t.id)
                          : [...cardForm.selectedTags, t.id];
                        setCardForm({ ...cardForm, selectedTags: selected });
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Member Selector */}
              <div className="form-group">
                <label className="form-label">Assign Members</label>
                <div className="member-selection-list scroller">
                  {members.map(m => (
                    <div 
                      key={m.id} 
                      className={`member-option ${cardForm.selectedMembers.includes(m.id) ? 'selected' : ''}`}
                      onClick={() => {
                        const exists = cardForm.selectedMembers.includes(m.id);
                        const selected = exists 
                          ? cardForm.selectedMembers.filter(id => id !== m.id)
                          : [...cardForm.selectedMembers, m.id];
                        setCardForm({ ...cardForm, selectedMembers: selected });
                      }}
                    >
                      <img src={m.avatar_url} alt={m.name} className="member-option-avatar" />
                      <div className="member-option-info">
                        <div className="member-option-name">{m.name}</div>
                        <div className="member-option-email">{m.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {activeModal === 'edit-card' && (
        <div className="modal-overlay" onClick={() => { setActiveModal(null); setSelectedCard(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Card</h2>
              <button className="action-icon-btn" onClick={() => handleDeleteCard(selectedCard.id)} title="Delete Card">
                <Trash2 size={18} style={{ color: 'var(--accent-danger)' }} />
              </button>
            </div>
            <form onSubmit={handleUpdateCard}>
              <div className="form-group">
                <label className="form-label">Card Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={cardForm.title}
                  onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  value={cardForm.description}
                  onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={cardForm.due_date}
                  onChange={(e) => setCardForm({ ...cardForm, due_date: e.target.value })}
                />
              </div>

              {/* Tag Selector */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tag-selection-grid">
                  {tags.map(t => (
                    <span 
                      key={t.id} 
                      className={`selectable-tag-pill ${cardForm.selectedTags.includes(t.id) ? 'selected' : ''}`}
                      style={{ backgroundColor: t.color }}
                      onClick={() => {
                        const exists = cardForm.selectedTags.includes(t.id);
                        const selected = exists 
                          ? cardForm.selectedTags.filter(id => id !== t.id)
                          : [...cardForm.selectedTags, t.id];
                        setCardForm({ ...cardForm, selectedTags: selected });
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Member Selector */}
              <div className="form-group">
                <label className="form-label">Assign Members</label>
                <div className="member-selection-list scroller">
                  {members.map(m => (
                    <div 
                      key={m.id} 
                      className={`member-option ${cardForm.selectedMembers.includes(m.id) ? 'selected' : ''}`}
                      onClick={() => {
                        const exists = cardForm.selectedMembers.includes(m.id);
                        const selected = exists 
                          ? cardForm.selectedMembers.filter(id => id !== m.id)
                          : [...cardForm.selectedMembers, m.id];
                        setCardForm({ ...cardForm, selectedMembers: selected });
                      }}
                    >
                      <img src={m.avatar_url} alt={m.name} className="member-option-avatar" />
                      <div className="member-option-info">
                        <div className="member-option-name">{m.name}</div>
                        <div className="member-option-email">{m.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setActiveModal(null); setSelectedCard(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tag Modal */}
      {activeModal === 'tag' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Tag</h2>
              <button className="action-icon-btn" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTag}>
              <div className="form-group">
                <label className="form-label">Tag Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  placeholder="e.g. Feature, Bug, Review"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tag Color</label>
                <input 
                  type="color" 
                  className="form-input" 
                  style={{ height: '40px', padding: '0.2rem' }}
                  required
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Tag</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Member Modal */}
      {activeModal === 'member' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Member</h2>
              <button className="action-icon-btn" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateMember}>
              <div className="form-group">
                <label className="form-label">Member Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Avatar URL (Optional)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={memberForm.avatar_url}
                  onChange={(e) => setMemberForm({ ...memberForm, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
