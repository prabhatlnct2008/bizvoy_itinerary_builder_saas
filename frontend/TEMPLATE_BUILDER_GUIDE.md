# Template Builder User Guide

## Overview
The Template Builder is a powerful 3-column interface for creating reusable itinerary templates in the Bizvoy Itinerary Builder.

## Accessing the Template Builder

### Creating a New Template
1. Navigate to **Templates** from the sidebar
2. Click the **Create Template** button
3. You'll be redirected to `/templates/new`

### Editing an Existing Template
1. Navigate to **Templates** from the sidebar
2. Click **Edit Template** on any template card
3. You'll be redirected to `/templates/:id`

## Template Builder Layout

### 3-Column Interface

```
┌─────────────────┬─────────────────┬──────────────────────────┐
│   Template      │   Day           │   Selected Day           │
│   Metadata      │   Timeline      │   Activities             │
│   (Left)        │   (Middle)      │   (Right)                │
├─────────────────┼─────────────────┼──────────────────────────┤
│ • Name          │ • Day 1 (3)     │ • Day Title              │
│ • Destination   │ • Day 2 (5) ←   │ • Day Notes              │
│ • Days/Nights   │ • Day 3 (2)     │ • Activity List:         │
│ • Price         │ • Day 4 (0)     │   1. [Activity Name]     │
│ • Description   │                 │      - Time slot         │
│                 │ Total: 4 days   │      - Custom notes      │
└─────────────────┴─────────────────┴──────────────────────────┘
```

## Using the Template Builder

### Step 1: Set Template Details (Left Column)

1. **Template Name** (required)
   - Example: "Kerala Premium 5D/4N"
   - Clear, descriptive name

2. **Destination** (required)
   - Example: "Kerala, India"
   - City, region, or country

3. **Duration**
   - **Days**: Number of days (min: 1)
   - **Nights**: Number of nights
   - Days auto-generate when you change this number

4. **Approximate Price** (optional)
   - Base price for the template
   - Used for client estimates

5. **Description** (optional)
   - Brief overview of the template
   - Appears on template card

### Step 2: Navigate Days (Middle Column)

The **Day Timeline** shows all days in your template:

- **Day Button**: Click to select a day
- **Activity Count**: Shows number of activities per day
- **Active Day**: Highlighted in primary color
- **Day Title Preview**: Shows custom day title if set

**Auto-Generated Days:**
- When you change "Days" in Template Details
- Days are automatically created or removed
- Existing day data is preserved

### Step 3: Build Day Itinerary (Right Column)

For the selected day:

#### Day Information
1. **Day Title** (optional)
   - Example: "Arrival in Kochi"
   - Descriptive title for the day

2. **Day Notes** (optional)
   - General notes for the day
   - Travel tips, timings, etc.

#### Activity Management

##### Adding Activities
1. Click **Add Activity** button
2. Modal opens with activity picker
3. Search or filter activities:
   - **Search**: Semantic search by name/description
   - **Filter**: By activity type
4. Click on an activity to add it
5. Activity appears in the list

##### Activity List Features
Each activity card shows:
- **Order Number**: Position in the schedule
- **Activity Name**: From activity library
- **Location**: Activity location
- **Time Slot**: When set (optional)

##### Activity Actions
- **Drag Handle** (⋮⋮): Drag to reorder
- **Expand** (▼): Show/hide details
- **Move Up** (↑): Move activity up
- **Move Down** (↓): Move activity down
- **Remove** (×): Delete from day

##### Editing Activity Details
Click expand button (▼) to show:
- **Time Slot**: e.g., "9:00 AM - 12:00 PM"
- **Custom Notes**: Special instructions
- **Activity Description**: Original description (read-only)

##### Reordering Activities

**Method 1: Drag and Drop**
1. Click and hold the drag handle (⋮⋮)
2. Drag the activity to new position
3. Release to drop
4. Display order updates automatically

**Method 2: Move Buttons**
1. Click ↑ to move up
2. Click ↓ to move down
3. One position at a time

### Step 4: Save Template

Top-right header buttons:

1. **Cancel**
   - Discards changes
   - Returns to template list

2. **Save Draft**
   - Saves as draft status
   - Can edit later
   - Not visible to users

3. **Save & Publish**
   - Saves and publishes
   - Sets status to "published"
   - Ready for use in itineraries

**Unsaved Changes Indicator:**
- Shows "Unsaved changes" when you modify data
- Cleared after successful save

## Features & Tips

### Validation
- Template name required
- Destination required
- Days must be ≥ 1
- Validation runs on save

### Duplicate Prevention
- Can't add same activity twice to one day
- Activity picker hides already-added activities

### State Management
- Changes tracked in Zustand store
- State cleared on navigation away
- Unsaved changes indicator

### Permissions
- **templates.view**: View templates
- **templates.create**: Create new templates
- **templates.edit**: Edit/update templates
- **templates.delete**: Delete templates

### Responsive Design
- 3-column layout on desktop
- Collapses on smaller screens
- Scrollable columns

## Workflow Example

### Creating a 3-Day Kerala Template

1. **Set Metadata**
   - Name: "Kerala Backwaters 3D/2N"
   - Destination: "Alleppey, Kerala"
   - Days: 3, Nights: 2
   - Price: 15000
   - Description: "Explore the serene backwaters..."

2. **Day 1: Arrival**
   - Select Day 1 from timeline
   - Title: "Arrival in Alleppey"
   - Add activities:
     1. Airport Transfer (9:00 AM - 11:00 AM)
     2. Houseboat Check-in (12:00 PM)
     3. Lunch on Houseboat (1:00 PM - 2:00 PM)

3. **Day 2: Backwaters**
   - Select Day 2
   - Title: "Backwater Exploration"
   - Add activities:
     1. Sunrise Cruise
     2. Village Tour
     3. Traditional Lunch
     4. Sunset Cruise

4. **Day 3: Departure**
   - Select Day 3
   - Title: "Departure"
   - Add activities:
     1. Breakfast
     2. Checkout
     3. Airport Drop

5. **Save & Publish**
   - Review all days
   - Click "Save & Publish"
   - Template ready for use!

## Keyboard Shortcuts

While no built-in shortcuts exist, you can:
- **Tab**: Navigate between fields
- **Enter**: Submit search in activity picker
- **Escape**: Close modal (if implemented)

## Common Tasks

### Duplicating a Day's Activities
Currently not supported - manual copy required

### Changing Duration
- Update "Days" field
- New days auto-created
- Existing days preserved

### Bulk Operations
Currently one-by-one only:
- Add activities individually
- Remove activities individually

## Troubleshooting

### Activities Not Loading
- Check network connection
- Verify you have active activities
- Check permissions

### Can't Save Template
- Verify required fields (name, destination)
- Check for validation errors
- Ensure you have edit permissions

### Drag and Drop Not Working
- Make sure to grab the drag handle (⋮⋮)
- Try move up/down buttons instead
- Refresh page if persistent

### Unsaved Changes Warning
- Always appears when modifying data
- Clears after successful save
- Not a blocker - informational only

## Best Practices

1. **Naming Convention**
   - Use destination + duration in name
   - Example: "Goa Beach 5D/4N"

2. **Activity Ordering**
   - Chronological order
   - Consider travel time
   - Group nearby activities

3. **Time Slots**
   - Set for time-sensitive activities
   - Leave flexible for others
   - Use ranges (9:00 AM - 12:00 PM)

4. **Day Titles**
   - Descriptive and engaging
   - "Arrival in Paradise" vs "Day 1"

5. **Save Often**
   - Use "Save Draft" frequently
   - Publish only when ready

## Next Steps

After creating a template:
1. Navigate to Itineraries
2. Create itinerary from template
3. Customize for specific client
4. Generate PDF or share link
