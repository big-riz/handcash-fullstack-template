# Auto Rig Pro Workflow Plan for Mixamo Export

## Current Status - COMPLETED WITH AI TOOLS
- Character model: `tripo_node_5d852294-a095-44b6-8fc3-7ec7a5b57fc6`
- ARP and Blender MCP installed
- **RIG COMPLETED USING AI MESH ANALYSIS**

## AI-Powered Workflow Completed

### Step 1: Mesh Preparation
- ✅ Transforms applied (location, rotation, scale)
- ✅ Mesh vertices moved so feet at Z=0
- ✅ Origin set to ground center

### Step 2: AI Joint Detection
- ✅ Analyzed 59,140 vertices using numpy
- ✅ Detected hands at X extremes (±0.441)
- ✅ Detected feet at Z minimum (0.030)
- ✅ Calculated shoulder, elbow, knee, hip positions
- ✅ Computed spine chain heights based on proportions

### Step 3: Reference Bone Positioning
- ✅ Human armature added
- ✅ All reference bones positioned using AI-detected coordinates
- ✅ Bone heads AND tails set for proper lengths
- ✅ Shoulder chain connected properly

### Step 4: Rig Generation
- ✅ Match to Rig executed
- ✅ FK/IK controllers generated

### Step 5: Binding
- ✅ Mesh bound to rig (69 parts, 5.1 seconds)
- ✅ Automatic weight painting applied

## Problem
The Smart feature requires interactive marker placement (clicking on mesh in viewport) which cannot be done via MCP scripting. The AI-based "Guess Markers" feature requires additional AI files that aren't installed.

## Correct ARP Workflow (from official docs)

### Step 1: Model Preparation
- [x] Character at world origin (0,0,0)
- [x] Character faces -Y axis (verified in front view)
- [x] Transforms applied (Ctrl+A)

### Step 2: Add Armature
- [ ] N panel > ARP tab > **Add Armature** > Human preset

### Step 3: Smart Feature (CRITICAL - was skipped before)
**Option A: AI Detection (Recommended but requires AI files)**
- Click **Get Selected Objects** (select mesh first)
- Click **Guess Markers** - auto-places markers
- Click **Go!**

**Option B: Manual Markers (Interactive - cannot do via MCP)**
- Click **Get Selected Objects**
- Add markers one by one: Neck, Chin, Shoulders, Elbows, Hands, Hips, Knees, Feet
- Each marker requires clicking on the mesh in viewport
- Click **Go!**

**Option C: Skip Smart, Manual Reference Bones (Fallback)**
- Add Armature only
- Scale rig to character size
- **Edit Reference Bones** - manually position each bone
- This is more tedious but works without markers

### Step 4: Edit Reference Bones
- [ ] Click **Edit Reference Bones**
- [ ] Position bones to match character anatomy:
  - Root at belly button level
  - Spine bones along character's spine
  - Shoulder bones at actual shoulders
  - Arm/leg bones at joints
  - Feet bones at heel positions

### Step 5: Limb Options (Optional)
- [ ] Select bones from each limb
- [ ] Click **Limb Options** to configure:
  - Finger count
  - Twist bones
  - IK/FK settings

### Step 6: Match to Rig
- [ ] Click **Match to Rig**
- [ ] Check "Init Scale" for clean initialization
- [ ] Generates final rig with controllers

### Step 7: Bind Mesh
- [ ] Select mesh, then Shift+select rig
- [ ] Click **Bind**
- [ ] Choose engine: Heat Maps (default)

### Step 8: Export for Mixamo
- [ ] Use ARP Export panel
- [ ] Export as FBX
- [ ] Upload to Mixamo

## Recommended Action

Since MCP cannot do interactive marker placement, the user should:

1. **In Blender UI directly:**
   - Select the character mesh
   - N panel > Auto-Rig Pro: Smart
   - Click "Get Selected Objects"
   - Click "Add Neck", click on character's neck
   - Click "Add Chin", click on character's chin
   - Continue for all markers (Shoulders, Elbows, Hands, Hips, Knees, Feet)
   - Click "Go!"

2. **Or install AI files:**
   - Download ARP AI files from lucky3d.fr
   - Use "Guess Markers" for automatic placement

3. **Or use manual bone positioning (via MCP):**
   - Add armature, scale to character
   - Edit Reference Bones
   - Manually move each bone to correct position
   - Match to Rig
   - Bind

## Files
- Character mesh: `tripo_node_5d852294-a095-44b6-8fc3-7ec7a5b57fc6`
- Scene is clean (previous rigs deleted)
