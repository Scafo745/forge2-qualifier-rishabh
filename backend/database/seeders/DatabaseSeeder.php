<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\KanbanList;
use App\Models\Card;
use App\Models\Tag;
use App\Models\Member;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Members
        $member1 = Member::create([
            'name' => 'Alice Vance',
            'email' => 'alice@example.com',
            'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
        ]);

        $member2 = Member::create([
            'name' => 'Bob Smith',
            'email' => 'bob@example.com',
            'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
        ]);

        $member3 = Member::create([
            'name' => 'Charlie Rose',
            'email' => 'charlie@example.com',
            'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
        ]);

        // 2. Create Tags
        $tagFeature = Tag::create(['name' => 'Feature', 'color' => '#0d6efd']); // Blue
        $tagBug = Tag::create(['name' => 'Bug', 'color' => '#dc3545']); // Red
        $tagHigh = Tag::create(['name' => 'High Priority', 'color' => '#fd7e14']); // Orange
        $tagDocs = Tag::create(['name' => 'Docs', 'color' => '#198754']); // Green

        // 3. Create Board
        $board = Board::create(['name' => 'Acme App Launch']);

        // 4. Create Kanban Lists
        $listBacklog = KanbanList::create(['board_id' => $board->id, 'name' => 'Backlog', 'position' => 0]);
        $listTodo = KanbanList::create(['board_id' => $board->id, 'name' => 'To Do', 'position' => 1]);
        $listInProgress = KanbanList::create(['board_id' => $board->id, 'name' => 'In Progress', 'position' => 2]);
        $listDone = KanbanList::create(['board_id' => $board->id, 'name' => 'Done', 'position' => 3]);

        // 5. Create Cards
        // Backlog Cards
        $card1 = Card::create([
            'kanban_list_id' => $listBacklog->id,
            'title' => 'Integrate Auth0 authentication',
            'description' => 'Setup SSO with Auth0 for enterprise customers. Need to configure client secrets and callback URLs.',
            'due_date' => now()->addDays(14),
            'position' => 0
        ]);
        $card1->tags()->attach([$tagFeature->id]);
        $card1->members()->attach([$member1->id]);

        $card2 = Card::create([
            'kanban_list_id' => $listBacklog->id,
            'title' => 'Write architectural guidelines',
            'description' => 'Document design patterns, database structure, and coding standards for new developers.',
            'due_date' => now()->addDays(20),
            'position' => 1
        ]);
        $card2->tags()->attach([$tagDocs->id]);
        $card2->members()->attach([$member2->id, $member3->id]);

        // To Do Cards
        $card3 = Card::create([
            'kanban_list_id' => $listTodo->id,
            'title' => 'Fix memory leak in websocket connections',
            'description' => 'Server CPU spikes after 4 hours. Trace connections and properly dispose of closed sockets.',
            'due_date' => now()->addDays(3),
            'position' => 0
        ]);
        $card3->tags()->attach([$tagBug->id, $tagHigh->id]);
        $card3->members()->attach([$member1->id, $member2->id]);

        $card4 = Card::create([
            'kanban_list_id' => $listTodo->id,
            'title' => 'Design dashboard analytics UI',
            'description' => 'Create mockups and designs for the custom analytics widgets showing weekly usage metrics.',
            'due_date' => now()->addDays(5),
            'position' => 1
        ]);
        $card4->tags()->attach([$tagFeature->id]);
        $card4->members()->attach([$member3->id]);

        // In Progress Cards
        $card5 = Card::create([
            'kanban_list_id' => $listInProgress->id,
            'title' => 'Implement Kanban drag-and-drop',
            'description' => 'Enable smooth dragging of cards across lists and reordering within lists using HTML5 Drag and Drop or a library.',
            'due_date' => now()->addDays(1),
            'position' => 0
        ]);
        $card5->tags()->attach([$tagFeature->id, $tagHigh->id]);
        $card5->members()->attach([$member2->id]);

        // Done Cards
        $card6 = Card::create([
            'kanban_list_id' => $listDone->id,
            'title' => 'Setup SQLite database schema',
            'description' => 'Create all base tables, pivot tables, and columns for boards, lists, cards, tags, and members.',
            'due_date' => now()->subDays(1),
            'position' => 0
        ]);
        $card6->tags()->attach([$tagFeature->id]);
        $card6->members()->attach([$member1->id, $member3->id]);
    }
}
