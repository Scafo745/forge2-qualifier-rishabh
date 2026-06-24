<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\KanbanList;
use App\Models\Card;
use App\Models\Tag;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KanbanController extends Controller
{
    // ==========================================
    // Board Operations
    // ==========================================
    public function getBoards()
    {
        return response()->json(Board::all());
    }

    public function storeBoard(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $board = Board::create($validated);

        // Seed default lists for a new board
        $defaultLists = ['To Do', 'In Progress', 'Done'];
        foreach ($defaultLists as $index => $name) {
            $board->kanbanLists()->create([
                'name' => $name,
                'position' => $index,
            ]);
        }

        return response()->json($board->load('kanbanLists'), 201);
    }

    public function showBoard(Board $board)
    {
        return response()->json($board->load(['kanbanLists.cards.tags', 'kanbanLists.cards.members']));
    }

    public function updateBoard(Request $request, Board $board)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $board->update($validated);
        return response()->json($board);
    }

    public function destroyBoard(Board $board)
    {
        $board->delete();
        return response()->json(['message' => 'Board deleted successfully']);
    }

    // ==========================================
    // List Operations
    // ==========================================
    public function storeList(Request $request)
    {
        $validated = $request->validate([
            'board_id' => 'required|exists:boards,id',
            'name' => 'required|string|max:255',
            'position' => 'integer',
        ]);

        if (!isset($validated['position'])) {
            $validated['position'] = KanbanList::where('board_id', $validated['board_id'])->count();
        }

        $list = KanbanList::create($validated);
        return response()->json($list, 201);
    }

    public function updateList(Request $request, KanbanList $list)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'position' => 'sometimes|integer',
        ]);

        $list->update($validated);

        // If list position is updated, reorder other lists
        if ($request->has('position')) {
            $this->reorderLists($list->board_id, $list->id, $validated['position']);
        }

        return response()->json($list);
    }

    public function destroyList(KanbanList $list)
    {
        $boardId = $list->board_id;
        $list->delete();

        // Reorder lists after deletion
        $lists = KanbanList::where('board_id', $boardId)->orderBy('position')->get();
        foreach ($lists as $index => $l) {
            $l->update(['position' => $index]);
        }

        return response()->json(['message' => 'List deleted successfully']);
    }

    private function reorderLists($boardId, $listId, $newPosition)
    {
        $lists = KanbanList::where('board_id', $boardId)
            ->where('id', '!=', $listId)
            ->orderBy('position')
            ->get();

        $position = 0;
        foreach ($lists as $l) {
            if ($position == $newPosition) {
                $position++;
            }
            $l->update(['position' => $position]);
            $position++;
        }
    }

    // ==========================================
    // Card Operations
    // ==========================================
    public function storeCard(Request $request)
    {
        $validated = $request->validate([
            'kanban_list_id' => 'required|exists:kanban_lists,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'position' => 'integer',
        ]);

        if (!isset($validated['position'])) {
            $validated['position'] = Card::where('kanban_list_id', $validated['kanban_list_id'])->count();
        }

        $card = Card::create($validated);
        return response()->json($card->load(['tags', 'members']), 201);
    }

    public function updateCard(Request $request, Card $card)
    {
        $validated = $request->validate([
            'kanban_list_id' => 'sometimes|required|exists:kanban_lists,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'position' => 'sometimes|integer',
        ]);

        $oldListId = $card->kanban_list_id;
        $newListId = $validated['kanban_list_id'] ?? $oldListId;
        $oldPosition = $card->position;
        $newPosition = $validated['position'] ?? $oldPosition;

        $card->update($validated);

        // Handle card reordering/movement
        if ($oldListId != $newListId) {
            // Moved to a different list
            $this->reorderCardsInList($oldListId);
            $this->reorderCardsInList($newListId, $card->id, $newPosition);
        } elseif ($oldPosition != $newPosition) {
            // Repositioned within the same list
            $this->reorderCardsInList($oldListId, $card->id, $newPosition);
        }

        return response()->json($card->load(['tags', 'members']));
    }

    public function destroyCard(Card $card)
    {
        $listId = $card->kanban_list_id;
        $card->delete();

        // Reorder remaining cards
        $this->reorderCardsInList($listId);

        return response()->json(['message' => 'Card deleted successfully']);
    }

    private function reorderCardsInList($listId, $cardId = null, $newPosition = null)
    {
        $query = Card::where('kanban_list_id', $listId);
        if ($cardId) {
            $query->where('id', '!=', $cardId);
        }
        $cards = $query->orderBy('position')->get();

        $position = 0;
        foreach ($cards as $c) {
            if ($cardId && $position == $newPosition) {
                $position++;
            }
            $c->update(['position' => $position]);
            $position++;
        }
    }

    public function syncTags(Request $request, Card $card)
    {
        $validated = $request->validate([
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $card->tags()->sync($validated['tags'] ?? []);
        return response()->json($card->load(['tags', 'members']));
    }

    public function syncMembers(Request $request, Card $card)
    {
        $validated = $request->validate([
            'members' => 'array',
            'members.*' => 'exists:members,id',
        ]);

        $card->members()->sync($validated['members'] ?? []);
        return response()->json($card->load(['tags', 'members']));
    }

    // ==========================================
    // Tag Operations
    // ==========================================
    public function getTags()
    {
        return response()->json(Tag::all());
    }

    public function storeTag(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:7', // Hex code validation
        ]);

        $tag = Tag::create($validated);
        return response()->json($tag, 201);
    }

    // ==========================================
    // Member Operations
    // ==========================================
    public function getMembers()
    {
        return response()->json(Member::all());
    }

    public function storeMember(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:members,email',
            'avatar_url' => 'nullable|url',
        ]);

        $member = Member::create($validated);
        return response()->json($member, 201);
    }

    public function destroyMember(Member $member)
    {
        $member->delete();
        return response()->json(['message' => 'Member deleted successfully']);
    }
}
