import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import {
    Save, Download, Upload, X, Plus, Edit, Trash2,
    Play, Pause, RotateCcw, Settings, Palette, Box, Layers, Move, Link, ArrowUpRight, Maximize
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomLevelData, MeshPlacement, PaintedArea, TimelineEvent, CustomMeshDefinition, SplinePath } from "./LevelEditor"
import { SeededRandom } from "@/lib/SeededRandom"
import { generateMeshObject } from "@/components/game/utils/meshUtils"
import { MESH_TYPES } from "@/components/game/data/meshes"
import { generateGroundTexture } from "@/components/game/utils/groundTextureGenerator"


// ... (interface definitions are the same)

type EditorMode = 'select' | 'mesh' | 'paint' | 'spline' | 'timeline'
type TransformMode = 'translate' | 'rotate' | 'scale'

export function VisualLevelEditor({
    isVisible,
    onClose,
    levelData,
    onUpdateLevel,
    onSave,
    onTest
}: VisualLevelEditorProps) {
    // Refs
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const groundRef = useRef<THREE.Mesh | null>(null)
    const playerRef = useRef<THREE.Mesh | null>(null)
    const moonLightRef = useRef<THREE.DirectionalLight | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const keysPressed = useRef(new Set<string>())
    const raycasterRef = useRef(new THREE.Raycaster())
    const meshObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map())
    const paintObjectsRef = useRef<Map<string, THREE.Group>>(new Map())
    const cursorMeshRef = useRef<THREE.Mesh | null>(null)
    const loadedModelsRef = useRef<Map<string, THREE.Group>>(new Map())
    const groundTextureRef = useRef<THREE.CanvasTexture | null>(null)
    const lastPaintPosRef = useRef<{ x: number, z: number } | null>(null)
    const splineObjectsRef = useRef<THREE.Object3D[]>([])
    const splinePreviewRef = useRef<THREE.Object3D[]>([])
    const gizmoGroupRef = useRef<THREE.Group | null>(null)
    const gizmoHandlesRef = useRef<THREE.Object3D[]>([])

    // State
    const [overlayElement, setOverlayElement] = useState<HTMLDivElement | null>(null)
    const [saveToast, setSaveToast] = useState(false)
    const [editorMode, setEditorMode] = useState<EditorMode>('select')
    const [cameraZoom, setCameraZoom] = useState(1)
    const [isPanning, setIsPanning] = useState(false)
    const [cameraPosition, setCameraPosition] = useState({ x: 0, z: 0 })
    const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null)
    const [cursorPosition, setCursorPosition] = useState<{ x: number, z: number } | null>(null)
    const [selectedMeshType, setSelectedMeshType] = useState('rock')
    const [meshScaleMin, setMeshScaleMin] = useState(0.8)
    const [meshScaleMax, setMeshScaleMax] = useState(1.2)
    const [meshRotation, setMeshRotation] = useState(0)
    const [randomizeRotation, setRandomizeRotation] = useState(true)
    const [randomizeScale, setRandomizeScale] = useState(false)
    const [paintMode, setPaintMode] = useState<'scatter' | 'color'>('scatter')
    const [scatterType, setScatterType] = useState('grass')
    const [scatterDensity, setScatterDensity] = useState(50)
    const [paintBrushSize, setPaintBrushSize] = useState(5)
    const [paintColor, setPaintColor] = useState('#4a7c3e')
    const [paintShape, setPaintShape] = useState<'circle' | 'square'>('circle')
    const [paintHardness, setPaintHardness] = useState(0.5)
    const [paintOpacity, setPaintOpacity] = useState(0.8)
    const [isEraser, setIsEraser] = useState(false)
    const [transformMode, setTransformMode] = useState<TransformMode>('translate')
    const [meshScale, setMeshScale] = useState(1.0)
    const [history, setHistory] = useState<CustomLevelData[]>([levelData])
    const [historyIndex, setHistoryIndex] = useState(0)

    // Spline state
    const [splinePoints, setSplinePoints] = useState<{ x: number, z: number }[]>([])
    const [splineMeshType, setSplineMeshType] = useState('fence_wood')
    const [splineSpacing, setSplineSpacing] = useState(2.0)
    const [splineScale, setSplineScale] = useState(1.0)
    const [splineClosed, setSplineClosed] = useState(false)
    const [splineHasCollision, setSplineHasCollision] = useState(true)
    const [editingSplineId, setEditingSplineId] = useState<string | null>(null)
    const [selectedSplineId, setSelectedSplineId] = useState<string | null>(null)

    // Gizmo drag state
    const [draggingGizmo, setDraggingGizmo] = useState<'translate_x' | 'translate_z' | 'rotate_y' | 'scale' | null>(null)
    const [dragStartWorld, setDragStartWorld] = useState<{ x: number, z: number } | null>(null)
    const [dragStartMeshValues, setDragStartMeshValues] = useState<{ x: number, z: number, rotY: number, scale: number } | null>(null)

    // Refs for accessing latest values without triggering re-renders
    const editorModeRef = useRef(editorMode)
    const isPanningRef = useRef(isPanning)
    const cameraZoomRef = useRef(cameraZoom)
    const selectedMeshTypeRef = useRef(selectedMeshType)
    const meshScaleMinRef = useRef(meshScaleMin)
    const meshScaleMaxRef = useRef(meshScaleMax)
    const meshRotationRef = useRef(meshRotation)
    const randomizeRotationRef = useRef(randomizeRotation)
    const randomizeScaleRef = useRef(randomizeScale)
    const paintModeRef = useRef(paintMode)
    const scatterTypeRef = useRef(scatterType)
    const scatterDensityRef = useRef(scatterDensity)
    const paintBrushSizeRef = useRef(paintBrushSize)
    const paintColorRef = useRef(paintColor)
    const paintShapeRef = useRef(paintShape)
    const paintHardnessRef = useRef(paintHardness)
    const paintOpacityRef = useRef(paintOpacity)
    const isEraserRef = useRef(isEraser)

    // Keep refs in sync
    useEffect(() => { editorModeRef.current = editorMode }, [editorMode])
    useEffect(() => { isPanningRef.current = isPanning }, [isPanning])
    useEffect(() => { cameraZoomRef.current = cameraZoom }, [cameraZoom])
    useEffect(() => { selectedMeshTypeRef.current = selectedMeshType }, [selectedMeshType])
    useEffect(() => { meshScaleMinRef.current = meshScaleMin }, [meshScaleMin])
    useEffect(() => { meshScaleMaxRef.current = meshScaleMax }, [meshScaleMax])
    useEffect(() => { meshRotationRef.current = meshRotation }, [meshRotation])
    useEffect(() => { randomizeRotationRef.current = randomizeRotation }, [randomizeRotation])
    useEffect(() => { randomizeScaleRef.current = randomizeScale }, [randomizeScale])
    useEffect(() => { paintModeRef.current = paintMode }, [paintMode])
    useEffect(() => { scatterTypeRef.current = scatterType }, [scatterType])
    useEffect(() => { scatterDensityRef.current = scatterDensity }, [scatterDensity])
    useEffect(() => { paintBrushSizeRef.current = paintBrushSize }, [paintBrushSize])
    useEffect(() => { paintColorRef.current = paintColor }, [paintColor])
    useEffect(() => { paintShapeRef.current = paintShape }, [paintShape])
    useEffect(() => { paintHardnessRef.current = paintHardness }, [paintHardness])
    useEffect(() => { paintOpacityRef.current = paintOpacity }, [paintOpacity])
    useEffect(() => { isEraserRef.current = isEraser }, [isEraser])

    // Spline refs for event handlers
    const splinePointsRef = useRef(splinePoints)
    const splineMeshTypeRef = useRef(splineMeshType)
    const splineSpacingRef = useRef(splineSpacing)
    const splineScaleRef = useRef(splineScale)
    const splineClosedRef = useRef(splineClosed)
    const splineHasCollisionRef = useRef(splineHasCollision)
    const selectedMeshIdRef = useRef(selectedMeshId)
    const draggingGizmoRef = useRef(draggingGizmo)
    useEffect(() => { selectedMeshIdRef.current = selectedMeshId }, [selectedMeshId])
    useEffect(() => { draggingGizmoRef.current = draggingGizmo }, [draggingGizmo])
    useEffect(() => { splinePointsRef.current = splinePoints }, [splinePoints])
    useEffect(() => { splineMeshTypeRef.current = splineMeshType }, [splineMeshType])
    useEffect(() => { splineSpacingRef.current = splineSpacing }, [splineSpacing])
    useEffect(() => { splineScaleRef.current = splineScale }, [splineScale])
    useEffect(() => { splineClosedRef.current = splineClosed }, [splineClosed])
    useEffect(() => { splineHasCollisionRef.current = splineHasCollision }, [splineHasCollision])

    const updateLevelWithHistory = (newData: CustomLevelData) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1)
            const updated = [...newHistory, JSON.parse(JSON.stringify(newData))]
            setHistoryIndex(updated.length - 1)
            return updated
        })
        onUpdateLevel(newData)
    }

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            onUpdateLevel(JSON.parse(JSON.stringify(history[newIndex])))
        }
    }

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            onUpdateLevel(JSON.parse(JSON.stringify(history[newIndex])))
        }
    }
    const cameraHeight = 50 // Direct top-down height
    const frustumSize = 24

    // Setup scene

    useEffect(() => {
        if (!isVisible || !containerRef.current) return

        const container = containerRef.current
        const width = container.clientWidth
        const height = container.clientHeight
        const aspect = width / height

        // Scene
        const scene = new THREE.Scene()
        const skyColor = levelData.theme.skyColor || 0x1a1e1a
        const groundColor = levelData.theme.groundColor
                scene.background = new THREE.Color(skyColor)
                scene.fog = new THREE.FogExp2(skyColor, 0.012)
                sceneRef.current = scene
        
        // Camera - Top-Down View
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,
            5000
        )
        camera.position.set(0, cameraHeight, 0)
        camera.up.set(0, 0, 1) // Set North as initial 'up'
        camera.lookAt(0, 0, 0)
        // Apply 180-degree roll to put +Z at the bottom and +X on the left
        camera.rotation.z = Math.PI 
        cameraRef.current = camera
        
                // Renderer
                const renderer = new THREE.WebGLRenderer({ antialias: true });        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        container.innerHTML = ""
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Make sure canvas doesn't block pointer events
        renderer.domElement.style.pointerEvents = 'none'
        console.log('[VisualEditor] Canvas pointer-events set to none')

        // Ground
        const groundGeo = new THREE.PlaneGeometry(3000, 3000)
        const groundMat = new THREE.MeshStandardMaterial({
            roughness: 0.8,
            metalness: 0.1,
            color: groundColor
        })
        const ground = new THREE.Mesh(groundGeo, groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.01
        ground.receiveShadow = true
        ground.name = 'ground'
        scene.add(ground)
        groundRef.current = ground

        // Grid
        const grid = new THREE.GridHelper(3000, 150, 0x888888, 0x666666)
        grid.position.y = 0.01
        scene.add(grid)

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 1.2))
        const moonLight = new THREE.DirectionalLight(0xddeeff, 2.5)
        moonLight.position.set(20, 50, -30)
        moonLight.castShadow = true
        moonLight.shadow.mapSize.width = 2048
        moonLight.shadow.mapSize.height = 2048
        moonLight.shadow.bias = -0.0005
        moonLight.shadow.normalBias = 0.02
        moonLight.shadow.camera.left = -50
        moonLight.shadow.camera.right = 50
        moonLight.shadow.camera.top = 50
        moonLight.shadow.camera.bottom = -50
        scene.add(moonLight)
        scene.add(moonLight.target)
        moonLightRef.current = moonLight

        // Player representation
        const playerGeo = new THREE.BoxGeometry(1, 2, 1)
        const playerMat = new THREE.MeshStandardMaterial({ color: 0x4488ff })
        const player = new THREE.Mesh(playerGeo, playerMat)
        player.position.set(0, 1, 0)
        player.castShadow = true
        scene.add(player)
        playerRef.current = player

        // Animation loop
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const handleResize = () => {
            if (!camera || !renderer || !container) return
            const w = container.clientWidth
            const h = container.clientHeight
            const aspect = w / h
            camera.left = frustumSize * aspect / -2
            camera.right = frustumSize * aspect / 2
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (renderer.domElement.parentElement) {
                renderer.domElement.parentElement.removeChild(renderer.domElement)
            }
            renderer.dispose()
            scene.clear()
        }
    }, [isVisible, levelData.theme.groundColor, levelData.theme.skyColor])

    // Render mesh placements (including custom GLTFs)
    useEffect(() => {
        if (!sceneRef.current) return
        const scene = sceneRef.current

        // Clean up previous meshes, including visual parts and hitboxes
        meshObjectsRef.current.forEach((obj, id) => {
            scene.remove(obj) // remove hitbox
            const visualMesh = scene.getObjectByName(`visual_${id}`)
            if (visualMesh) scene.remove(visualMesh)
        })
        meshObjectsRef.current.clear()

        // Helper to add mesh to scene
        const addMeshToScene = (mesh: THREE.Object3D, placement: MeshPlacement) => {
            mesh.position.set(placement.position.x, placement.position.y, placement.position.z)
            mesh.rotation.set(placement.rotation.x, placement.rotation.y, placement.rotation.z)
            mesh.scale.set(placement.scale.x, placement.scale.y, placement.scale.z)
            
            mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true
                    child.receiveShadow = true
                    
                    if (selectedMeshId === placement.id) {
                        child.material = child.material.clone()
                        if ('emissive' in child.material) {
                            child.material.emissive = new THREE.Color(0xffff00)
                            child.material.emissiveIntensity = 0.3
                        }
                    }
                }
            })

            mesh.userData.placementId = placement.id
            mesh.name = `visual_${placement.id}`
            scene.add(mesh)

            // Use an invisible bounding box for consistent raycasting
            const visualBox = new THREE.Box3().setFromObject(mesh)
            const visualCenter = visualBox.getCenter(new THREE.Vector3())
            const visualSize = visualBox.getSize(new THREE.Vector3())
            
            // Adjust hit size to be slightly more generous for small objects but tightly aligned
            const hitGeo = new THREE.BoxGeometry(
                Math.max(visualSize.x, 0.5), 
                Math.max(visualSize.y, 0.5), 
                Math.max(visualSize.z, 0.5)
            )
            const hitMat = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 })
            const hitMesh = new THREE.Mesh(hitGeo, hitMat)
            hitMesh.position.copy(visualCenter)
            hitMesh.userData.placementId = placement.id
            scene.add(hitMesh)
            meshObjectsRef.current.set(placement.id, hitMesh)
        }

        // Create mesh objects from levelData
        levelData.meshPlacements?.forEach(placement => {
            const customDef = levelData.customMeshDefinitions?.find(d => d.id === placement.meshType)
            
            if (customDef) {
                if (loadedModelsRef.current.has(customDef.url)) {
                    const cachedModel = loadedModelsRef.current.get(customDef.url)
                    if (cachedModel) {
                        const clone = cachedModel.clone(true)
                        addMeshToScene(clone, placement)
                    }
                } else {
                    const loader = new GLTFLoader()
                    loader.load(customDef.url, (gltf) => {
                        const model = gltf.scene
                        
                        // Robustly center the model and set its base at y=0
                        const box = new THREE.Box3().setFromObject(model)
                        const center = box.getCenter(new THREE.Vector3())
                        const size = box.getSize(new THREE.Vector3())
                        
                        // Offset the model inside the wrapper group
                        model.position.x -= center.x
                        model.position.y -= center.y
                        model.position.y += size.y / 2
                        
                        const wrapper = new THREE.Group()
                        wrapper.add(model)
                        
                        loadedModelsRef.current.set(customDef.url, wrapper)
                        
                        const clone = wrapper.clone(true)
                        addMeshToScene(clone, placement)
                    }, undefined, (error) => {
                        console.error('Failed to load mesh:', customDef.url, error)
                        const geo = new THREE.BoxGeometry(1, 1, 1)
                        const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 })
                        const mesh = new THREE.Mesh(geo, mat)
                        addMeshToScene(mesh, placement)
                    })
                }
            } else {
                // Handle Standard Mesh using our new utility
                const mesh = generateMeshObject(placement.meshType)
                addMeshToScene(mesh, placement)
            }
        })
    }, [levelData.meshPlacements, selectedMeshId, levelData.customMeshDefinitions])


    // Render paint areas (Terrain Texture & Scatter)
    useEffect(() => {
        if (!sceneRef.current || !groundRef.current) return
        const scene = sceneRef.current

        // Clear existing scatter paint objects (texture painting is handled separately)
        paintObjectsRef.current.forEach(group => scene.remove(group))
        paintObjectsRef.current.clear()

        // 1. Handle Texture Painting (Color Areas)
        const gtConfig = levelData.theme?.groundTexture
        let canvas: HTMLCanvasElement
        if (gtConfig && gtConfig.preset !== 'none') {
            canvas = generateGroundTexture(
                levelData.theme.groundColor || 0x3d453d,
                gtConfig,
                2048,
                levelData.id.length * 31 + 42
            )
        } else {
            canvas = document.createElement('canvas')
            canvas.width = 2048
            canvas.height = 2048
            const baseCtx = canvas.getContext('2d')
            if (baseCtx) {
                const groundColor = levelData.theme.groundColor || 0x3d453d
                baseCtx.fillStyle = `#${groundColor.toString(16).padStart(6, '0')}`
                baseCtx.fillRect(0, 0, 2048, 2048)
            }
        }
        const ctx = canvas.getContext('2d')

        if (ctx) {
            // Create Paint Layer (for compositing erase properly)
            const paintCanvas = document.createElement('canvas')
            paintCanvas.width = 2048
            paintCanvas.height = 2048
            const pCtx = paintCanvas.getContext('2d')

            if (pCtx) {
                // Coordinate mapping constants
                const scale = 2048 / 3000
                const centerOffset = 1500

                // Draw painted areas onto Paint Layer
                levelData.paintedAreas?.forEach(area => {
                    if (area.type === 'color' && area.color) {
                        pCtx.save()
                        
                        // Handle Erase
                        if (area.isEraser) {
                            pCtx.globalCompositeOperation = 'destination-out'
                            pCtx.fillStyle = 'rgba(0,0,0,1)' // Color doesn't matter for destination-out
                        } else {
                            pCtx.globalCompositeOperation = 'source-over'
                            pCtx.fillStyle = area.color
                        }

                        // Apply Opacity
                        pCtx.globalAlpha = area.opacity ?? 1.0

                        // Handle Hardness (simulated via shadowBlur)
                        // Inverse logic: hardness 1.0 = blur 0. hardness 0.0 = blur 20?
                        const blurAmount = (1.0 - (area.hardness ?? 1.0)) * 20
                        if (blurAmount > 0) {
                            pCtx.shadowBlur = blurAmount
                            pCtx.shadowColor = area.isEraser ? 'rgba(0,0,0,1)' : area.color
                        }

                        // Convert center point
                        // Points array stores [TL, TR, BR, BL] for square.
                        // We can derive center and size from it.
                        // Or just use the points polygon.
                        const points = area.points.map(p => ({
                            x: (p.x + centerOffset) * scale,
                            y: (p.y + centerOffset) * scale
                        }))

                        if (area.shape === 'circle') {
                            // Calculate center and radius from points (assuming square bounds)
                            // Width of box = points[1].x - points[0].x
                            const width = Math.abs(points[1].x - points[0].x)
                            const radius = width / 2
                            const centerX = (points[0].x + points[2].x) / 2
                            const centerY = (points[0].y + points[2].y) / 2

                            pCtx.beginPath()
                            pCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                            pCtx.fill()
                        } else {
                            // Square/Polygon
                            if (points.length >= 3) {
                                pCtx.beginPath()
                                pCtx.moveTo(points[0].x, points[0].y)
                                for (let i = 1; i < points.length; i++) {
                                    pCtx.lineTo(points[i].x, points[i].y)
                                }
                                pCtx.closePath()
                                pCtx.fill()
                            }
                        }
                        
                        pCtx.restore()
                    }
                })

                // Composite Paint Layer onto Base Layer
                ctx.drawImage(paintCanvas, 0, 0)
            }

            // Update ground texture
            const texture = new THREE.CanvasTexture(canvas)
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.colorSpace = THREE.SRGBColorSpace // Ensure correct color space
            
            const material = groundRef.current.material as THREE.MeshStandardMaterial
            if (material.map) material.map.dispose()
            material.map = texture
            material.needsUpdate = true
            groundTextureRef.current = texture
        }

        // 2. Handle Scatter Meshes (3D Objects)
        levelData.paintedAreas?.forEach(area => {
            if (area.type === 'scatter') {
                const group = new THREE.Group()
                const count = Math.floor((area.density || 50) / 5)
                
                // Deterministic seed based on area ID
                // Simple hash of ID string
                let seed = 0;
                for (let i = 0; i < area.id.length; i++) {
                    seed = ((seed << 5) - seed) + area.id.charCodeAt(i);
                    seed |= 0;
                }

                for (let i = 0; i < count; i++) {
                    // Generate specific scatter mesh
                    const scatterObject = generateScatterObject(area.meshType || 'grass', seed + i)

                    // Random position within area bounds
                    const points = area.points
                    const minX = Math.min(...points.map(p => p.x))
                    const maxX = Math.max(...points.map(p => p.x))
                    const minZ = Math.min(...points.map(p => p.y))
                    const maxZ = Math.max(...points.map(p => p.y))

                    // Simple bounding box random placement
                    // (Ideally, we should check point-in-polygon if area is irregular, but rect is fine for now)
                    scatterObject.position.set(
                        minX + Math.random() * (maxX - minX),
                        0, // generateScatterObject handles Y offset internally
                        minZ + Math.random() * (maxZ - minZ)
                    )
                    
                    group.add(scatterObject)
                }
                scene.add(group)
                paintObjectsRef.current.set(area.id, group)
            }
        })
    }, [levelData.paintedAreas, levelData.theme.groundColor, levelData.theme.groundTexture])

    // Render finalized spline paths
    useEffect(() => {
        if (!sceneRef.current) return
        const scene = sceneRef.current

        // Clean up previous spline objects
        splineObjectsRef.current.forEach(obj => scene.remove(obj))
        splineObjectsRef.current = []

        levelData.splinePaths?.forEach(sp => {
            if (sp.controlPoints.length < 2) return

            const points3D = sp.controlPoints.map(p => new THREE.Vector3(p.x, 0, p.z))
            const curve = new THREE.CatmullRomCurve3(points3D, sp.closed)
            const totalLength = curve.getLength()
            const count = Math.max(1, Math.floor(totalLength / sp.spacing))

            for (let i = 0; i <= count; i++) {
                const t = i / count
                const point = curve.getPointAt(t)
                const tangent = curve.getTangentAt(t)
                const angle = Math.atan2(tangent.x, tangent.z)

                const mesh = generateMeshObject(sp.meshType)
                mesh.position.copy(point)
                mesh.rotation.y = angle
                mesh.scale.setScalar(sp.scale)
                mesh.userData.splineId = sp.id

                // Highlight selected spline
                if (selectedSplineId === sp.id) {
                    mesh.traverse(child => {
                        if (child instanceof THREE.Mesh) {
                            child.material = child.material.clone()
                            if ('emissive' in child.material) {
                                child.material.emissive = new THREE.Color(0x00ffff)
                                child.material.emissiveIntensity = 0.3
                            }
                        }
                    })
                }

                scene.add(mesh)
                splineObjectsRef.current.push(mesh)
            }
        })
    }, [levelData.splinePaths, selectedSplineId])

    // Render spline control point preview while placing
    useEffect(() => {
        if (!sceneRef.current) return
        const scene = sceneRef.current

        // Clean up previous preview
        splinePreviewRef.current.forEach(obj => scene.remove(obj))
        splinePreviewRef.current = []

        if (editorMode !== 'spline' || splinePoints.length === 0) return

        // Yellow spheres for control points
        const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5 })
        splinePoints.forEach(p => {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), sphereMat)
            sphere.position.set(p.x, 0.3, p.z)
            scene.add(sphere)
            splinePreviewRef.current.push(sphere)
        })

        // Dashed line connecting points
        if (splinePoints.length >= 2) {
            const pts3D = splinePoints.map(p => new THREE.Vector3(p.x, 0.15, p.z))
            if (splineClosed && pts3D.length >= 3) {
                pts3D.push(pts3D[0].clone())
            }
            const curve = new THREE.CatmullRomCurve3(pts3D, false)
            const linePoints = curve.getPoints(pts3D.length * 20)
            const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
            const lineMat = new THREE.LineDashedMaterial({ color: 0xffff00, dashSize: 0.5, gapSize: 0.3 })
            const line = new THREE.Line(lineGeo, lineMat)
            line.computeLineDistances()
            scene.add(line)
            splinePreviewRef.current.push(line)

            // Preview meshes along the curve
            const totalLen = curve.getLength()
            const previewCount = Math.max(1, Math.floor(totalLen / splineSpacing))
            const previewMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 })
            for (let i = 0; i <= previewCount; i++) {
                const t = i / previewCount
                const point = curve.getPointAt(t)
                const tangent = curve.getTangentAt(t)
                const angle = Math.atan2(tangent.x, tangent.z)

                const mesh = generateMeshObject(splineMeshType)
                mesh.position.copy(point)
                mesh.position.y = 0
                mesh.rotation.y = angle
                mesh.scale.setScalar(splineScale)
                mesh.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.material = previewMat
                    }
                })
                scene.add(mesh)
                splinePreviewRef.current.push(mesh)
            }
        }
    }, [editorMode, splinePoints, splineMeshType, splineSpacing, splineScale, splineClosed])

    // Camera zoom
    useEffect(() => {
        if (!cameraRef.current) return
        cameraRef.current.zoom = cameraZoom
        cameraRef.current.updateProjectionMatrix()
    }, [cameraZoom])

    // Camera pan
    useEffect(() => {
        if (!cameraRef.current) return
        const cam = cameraRef.current
        const moonLight = moonLightRef.current

        cam.position.x = cameraPosition.x
        cam.position.y = cameraHeight // Absolute Y-position for top-down
        cam.position.z = cameraPosition.z
        cam.lookAt(cameraPosition.x, 0, cameraPosition.z)

        if (moonLight) {
            moonLight.position.set(cameraPosition.x + 20, 50, cameraPosition.z - 30)
            moonLight.target.position.set(cameraPosition.x, 0, cameraPosition.z)
        }
    }, [cameraPosition])

    // Update cursor preview mesh
    useEffect(() => {
        if (!sceneRef.current) return
        const scene = sceneRef.current

        if (cursorMeshRef.current) {
            scene.remove(cursorMeshRef.current)
            cursorMeshRef.current = null
        }

        if (editorMode === 'mesh' && cursorPosition) {
            const customDef = levelData.customMeshDefinitions?.find(d => d.id === selectedMeshType)

            if (customDef) {
                // Handle custom mesh preview
                const cachedModel = loadedModelsRef.current.get(customDef.url)
                if (cachedModel) {
                    const previewMesh = cachedModel.clone(true)
                    previewMesh.position.set(cursorPosition.x, 0, cursorPosition.z)
                    previewMesh.rotation.y = meshRotation * Math.PI / 180
                    previewMesh.scale.setScalar(meshScale)

                    previewMesh.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.material = child.material.clone()
                            child.material.transparent = true
                            child.material.opacity = 0.5
                        }
                    })

                    scene.add(previewMesh)
                    cursorMeshRef.current = previewMesh
                } else {
                    // Show placeholder if model not loaded yet
                    const geo = new THREE.BoxGeometry(2, 2, 2)
                    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })
                    const mesh = new THREE.Mesh(geo, mat)
                    mesh.position.set(cursorPosition.x, 1, cursorPosition.z)
                    scene.add(mesh)
                    cursorMeshRef.current = mesh
                }
            } else {
                // Handle standard primitive preview using our new utility
                const previewMesh = generateMeshObject(selectedMeshType)
                previewMesh.position.set(cursorPosition.x, 0, cursorPosition.z)
                previewMesh.rotation.y = meshRotation * Math.PI / 180
                previewMesh.scale.setScalar(meshScale)

                previewMesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = child.material.clone()
                        child.material.transparent = true
                        child.material.opacity = 0.5
                    }
                })

                scene.add(previewMesh)
                cursorMeshRef.current = previewMesh as THREE.Mesh
            }
        }


        // Show paint brush cursor
        if (editorMode === 'paint' && cursorPosition) {
            let geometry: THREE.BufferGeometry
            if (paintShape === 'circle') {
                geometry = new THREE.CircleGeometry(paintBrushSize, 32)
            } else {
                // paintBrushSize is radius/half-width
                geometry = new THREE.PlaneGeometry(paintBrushSize * 2, paintBrushSize * 2)
            }
            
            const material = new THREE.MeshBasicMaterial({
                color: isEraser ? 0xff0000 : (paintMode === 'color' ? paintColor : 0x4a7c3e),
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.rotation.x = -Math.PI / 2
            mesh.position.set(cursorPosition.x, 0.05, cursorPosition.z)
            scene.add(mesh)
            cursorMeshRef.current = mesh
        }

    }, [editorMode, cursorPosition, selectedMeshType, meshScale, meshRotation, paintMode, paintBrushSize, paintColor, levelData.customMeshDefinitions])

    // WASD controls
    useEffect(() => {
        if (!isVisible) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                keysPressed.current.add(e.key.toLowerCase())
            }

            // Undo / Redo
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    if (e.shiftKey) redo()
                    else undo()
                    e.preventDefault()
                } else if (e.key.toLowerCase() === 'y') {
                    redo()
                    e.preventDefault()
                }
            }

            // Delete key to remove selected mesh
            if (e.key === 'Delete' && selectedMeshId) {
                deleteMesh(selectedMeshId)
            }

            // Spline: Enter to finalize, Escape to cancel
            if (editorModeRef.current === 'spline') {
                if (e.key === 'Enter') {
                    finalizeSpline()
                    e.preventDefault()
                } else if (e.key === 'Escape') {
                    cancelSpline()
                    e.preventDefault()
                }
            }

            // Arrow key nudging for selected mesh (select mode)
            if (editorModeRef.current === 'select' && selectedMeshIdRef.current) {
                const nudge = e.shiftKey ? 0.1 : 0.5
                const id = selectedMeshIdRef.current
                const mesh = levelData.meshPlacements?.find((m: MeshPlacement) => m.id === id)
                if (mesh && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault()
                    let dx = 0, dz = 0
                    if (e.key === 'ArrowUp') dz = nudge
                    if (e.key === 'ArrowDown') dz = -nudge
                    if (e.key === 'ArrowLeft') dx = nudge
                    if (e.key === 'ArrowRight') dx = -nudge
                    updateMeshPlacement(id, {
                        position: { x: mesh.position.x + dx, y: mesh.position.y, z: mesh.position.z + dz }
                    })
                }
            }
        }

        const onKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.key.toLowerCase())
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)

        const interval = setInterval(() => {
            if (keysPressed.current.size === 0) return
            const speed = 0.5 / cameraZoom
            let dx = 0, dz = 0

            // WASD for 180-degree rotated top-down view (+Z at bottom, +X at left)
            // Vertical inverted per user request
            if (keysPressed.current.has('w')) dz += speed // Move target towards World +Z
            if (keysPressed.current.has('s')) dz -= speed // Move target towards World -Z
            if (keysPressed.current.has('a')) dx += speed // Move target LEFT on screen (World +X)
            if (keysPressed.current.has('d')) dx -= speed // Move target RIGHT on screen (World -X)

            if (dx || dz) {
                setCameraPosition(prev => ({ x: prev.x + dx, z: prev.z + dz }))
            }
        }, 16)

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            clearInterval(interval)
            keysPressed.current.clear()
        }
    }, [isVisible, cameraZoom, selectedMeshId])

    // Custom gizmo rendering for selected mesh
    useEffect(() => {
        if (!sceneRef.current) return
        const scene = sceneRef.current

        // Clean up previous gizmo
        if (gizmoGroupRef.current) {
            scene.remove(gizmoGroupRef.current)
            gizmoGroupRef.current = null
        }
        gizmoHandlesRef.current = []

        if (editorMode !== 'select' || !selectedMeshId) return

        const placement = levelData.meshPlacements?.find((m: MeshPlacement) => m.id === selectedMeshId)
        if (!placement) return

        const gizmoGroup = new THREE.Group()
        gizmoGroup.position.set(placement.position.x, 0.05, placement.position.z)
        gizmoGroup.name = 'gizmo_group'

        const makeArrow = (color: number, dir: THREE.Vector3, name: string) => {
            const group = new THREE.Group()
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8),
                new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 })
            )
            shaft.position.copy(dir.clone().multiplyScalar(1.0))
            // Rotate shaft to align with direction
            if (dir.x !== 0) shaft.rotation.z = -Math.PI / 2
            // Z-axis shaft needs rotation around X
            if (dir.z !== 0) shaft.rotation.x = Math.PI / 2
            shaft.renderOrder = 999
            group.add(shaft)

            const tip = new THREE.Mesh(
                new THREE.ConeGeometry(0.15, 0.4, 8),
                new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 })
            )
            tip.position.copy(dir.clone().multiplyScalar(2.0))
            if (dir.x !== 0) tip.rotation.z = dir.x > 0 ? -Math.PI / 2 : Math.PI / 2
            if (dir.z !== 0) tip.rotation.x = dir.z > 0 ? Math.PI / 2 : -Math.PI / 2
            tip.renderOrder = 999
            group.add(tip)

            // Invisible wider hitbox
            const hitbox = new THREE.Mesh(
                new THREE.BoxGeometry(dir.x !== 0 ? 2.5 : 0.5, 0.5, dir.z !== 0 ? 2.5 : 0.5),
                new THREE.MeshBasicMaterial({ visible: false })
            )
            hitbox.position.copy(dir.clone().multiplyScalar(1.0))
            hitbox.userData.gizmoType = name
            hitbox.renderOrder = 999
            group.add(hitbox)
            gizmoHandlesRef.current.push(hitbox)

            return group
        }

        if (transformMode === 'translate') {
            gizmoGroup.add(makeArrow(0xff4444, new THREE.Vector3(1, 0, 0), 'translate_x'))
            gizmoGroup.add(makeArrow(0x4444ff, new THREE.Vector3(0, 0, 1), 'translate_z'))
            // Center square for free translate
            const center = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.1, 0.4),
                new THREE.MeshBasicMaterial({ color: 0xffff44, depthTest: false, transparent: true, opacity: 0.7 })
            )
            center.position.y = 0.05
            center.renderOrder = 999
            gizmoGroup.add(center)
        } else if (transformMode === 'rotate') {
            const torusGeo = new THREE.TorusGeometry(1.5, 0.06, 8, 32)
            const torusMat = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, transparent: true, opacity: 0.9 })
            const torus = new THREE.Mesh(torusGeo, torusMat)
            torus.rotation.x = Math.PI / 2
            torus.renderOrder = 999
            gizmoGroup.add(torus)

            // Hitbox torus (wider)
            const hitTorus = new THREE.Mesh(
                new THREE.TorusGeometry(1.5, 0.25, 8, 32),
                new THREE.MeshBasicMaterial({ visible: false })
            )
            hitTorus.rotation.x = Math.PI / 2
            hitTorus.userData.gizmoType = 'rotate_y'
            gizmoGroup.add(hitTorus)
            gizmoHandlesRef.current.push(hitTorus)
        } else if (transformMode === 'scale') {
            // Green cube handle at corner
            const scaleCube = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.3),
                new THREE.MeshBasicMaterial({ color: 0x44ff44, depthTest: false, transparent: true, opacity: 0.9 })
            )
            scaleCube.position.set(1.5, 0.15, 1.5)
            scaleCube.renderOrder = 999
            gizmoGroup.add(scaleCube)

            // Wider hitbox
            const scaleHit = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 0.8),
                new THREE.MeshBasicMaterial({ visible: false })
            )
            scaleHit.position.set(1.5, 0.15, 1.5)
            scaleHit.userData.gizmoType = 'scale'
            gizmoGroup.add(scaleHit)
            gizmoHandlesRef.current.push(scaleHit)

            // Dashed lines from center to handle
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0.15, 0),
                new THREE.Vector3(1.5, 0.15, 0),
            ])
            const lineGeo2 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0.15, 0),
                new THREE.Vector3(0, 0.15, 1.5),
            ])
            const lineMat = new THREE.LineDashedMaterial({ color: 0x44ff44, dashSize: 0.2, gapSize: 0.1, depthTest: false })
            const line1 = new THREE.Line(lineGeo, lineMat)
            line1.computeLineDistances()
            line1.renderOrder = 999
            gizmoGroup.add(line1)
            const line2 = new THREE.Line(lineGeo2, lineMat)
            line2.computeLineDistances()
            line2.renderOrder = 999
            gizmoGroup.add(line2)
        }

        scene.add(gizmoGroup)
        gizmoGroupRef.current = gizmoGroup

        return () => {
            scene.remove(gizmoGroup)
            gizmoGroupRef.current = null
            gizmoHandlesRef.current = []
        }
    }, [selectedMeshId, editorMode, transformMode, levelData.meshPlacements])

    // Native wheel event listener with { passive: false } to prevent scroll
    useEffect(() => {
        if (!isVisible || !overlayElement) return

        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault()
            setCameraZoom(prev => Math.max(0.01, Math.min(10, prev * (e.deltaY > 0 ? 0.9 : 1.1))))
        }

        overlayElement.addEventListener('wheel', handleNativeWheel, { passive: false })

        return () => {
            overlayElement.removeEventListener('wheel', handleNativeWheel)
        }
    }, [isVisible, overlayElement])

    // Raycasting for mouse interaction
    const getPointerWorldPosition = (e: React.PointerEvent | React.MouseEvent): { x: number, z: number } | null => {
        if (!containerRef.current || !cameraRef.current || !groundRef.current) return null

        const rect = containerRef.current.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        )

        raycasterRef.current.setFromCamera(mouse, cameraRef.current)
        const intersects = raycasterRef.current.intersectObject(groundRef.current)

        if (intersects.length > 0) {
            const point = intersects[0].point
            return { x: Math.round(point.x * 2) / 2, z: Math.round(point.z * 2) / 2 } // Snap to 0.5 grid
        }
        return null
    }

    // Mesh operations
    const placeMesh = (pos: { x: number, z: number } | null) => {
        if (!pos) {
            console.warn('[VisualEditor] Cannot place mesh - no position')
            return
        }

        let finalScale = meshScale
        if (randomizeScale) {
            finalScale = meshScale * (0.5 + Math.random())
        }

        let finalRotationY = meshRotation * Math.PI / 180
        if (randomizeRotation) {
            finalRotationY = Math.random() * Math.PI * 2
        }

        const newMesh: MeshPlacement = {
            id: `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            meshType: selectedMeshType,
            position: { x: pos.x, y: 0, z: pos.z },
            rotation: { x: 0, y: finalRotationY, z: 0 },
            scale: { x: finalScale, y: finalScale, z: finalScale },
            isStatic: true,
            hasCollision: true
        }

        console.log('[VisualEditor] Placing mesh:', newMesh)

        updateLevelWithHistory({
            ...levelData,
            meshPlacements: [...(levelData.meshPlacements || []), newMesh]
        })
    }


    const deleteMesh = (meshId: string) => {
        updateLevelWithHistory({
            ...levelData,
            meshPlacements: (levelData.meshPlacements || []).filter(m => m.id !== meshId)
        })
        setSelectedMeshId(null)
    }

    const updateMeshPlacement = (meshId: string, updates: Partial<MeshPlacement>) => {
        const updatedPlacements = (levelData.meshPlacements || []).map(m => {
            if (m.id !== meshId) return m
            return { ...m, ...updates }
        })
        updateLevelWithHistory({ ...levelData, meshPlacements: updatedPlacements })
    }

    // Live-update mesh during gizmo drag (no history push)
    const liveDragUpdateMesh = (meshId: string, updates: Partial<MeshPlacement>) => {
        const updatedPlacements = (levelData.meshPlacements || []).map(m => {
            if (m.id !== meshId) return m
            return { ...m, ...updates }
        })
        onUpdateLevel({ ...levelData, meshPlacements: updatedPlacements })
    }

    const eraseMeshAtCursor = (e: React.PointerEvent | React.MouseEvent) => {
        if (!containerRef.current || !cameraRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        )

        raycasterRef.current.setFromCamera(mouse, cameraRef.current)
        const meshArray = Array.from(meshObjectsRef.current.values())
        const intersects = raycasterRef.current.intersectObjects(meshArray)

        if (intersects.length > 0) {
            const mesh = intersects[0].object as THREE.Mesh
            const placementId = mesh.userData.placementId
            if (placementId) {
                console.log('[VisualEditor] Erasing mesh:', placementId)
                deleteMesh(placementId)
            }
        }
    }

    const selectMeshAtCursor = (e: React.PointerEvent | React.MouseEvent) => {
        if (!containerRef.current || !cameraRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        )

        raycasterRef.current.setFromCamera(mouse, cameraRef.current)
        const meshArray = Array.from(meshObjectsRef.current.values())
        const intersects = raycasterRef.current.intersectObjects(meshArray)

        if (intersects.length > 0) {
            const mesh = intersects[0].object as THREE.Mesh
            const placementId = mesh.userData.placementId
            setSelectedMeshId(placementId)
        } else {
            setSelectedMeshId(null)
        }
    }

    const paintArea = (pos: { x: number, z: number } | null) => {
        // ... (existing paintArea logic)
        if (!pos) {
            console.warn('[VisualEditor] Cannot paint - no position')
            return
        }

        if (isEraser) {
            // Eraser Mode: Remove intersecting areas
            const brushRadius = paintBrushSize
            const updatedAreas = (levelData.paintedAreas || []).filter(area => {
                // Calculate area center and rough size
                let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
                area.points.forEach(p => {
                    minX = Math.min(minX, p.x)
                    maxX = Math.max(maxX, p.x)
                    minZ = Math.min(minZ, p.y)
                    maxZ = Math.max(maxZ, p.y)
                })
                
                const centerX = (minX + maxX) / 2
                const centerZ = (minZ + maxZ) / 2
                const areaRadius = Math.max(maxX - minX, maxZ - minZ) / 2

                // Simple circle-circle intersection check
                // (Optimized: check squared distance)
                const distSq = (pos.x - centerX) ** 2 + (pos.z - centerZ) ** 2
                const hitRadius = brushRadius + areaRadius
                
                // If distance is less than sum of radii, they overlap -> Remove it (return false)
                return distSq > hitRadius ** 2
            })

            if (updatedAreas.length !== (levelData.paintedAreas?.length || 0)) {
                console.log(`[VisualEditor] Erased ${ (levelData.paintedAreas?.length || 0) - updatedAreas.length } areas`)
                updateLevelWithHistory({
                    ...levelData,
                    paintedAreas: updatedAreas
                })
            }
        } else {
            // Paint Mode: Add new area
            const newArea: PaintedArea = {
                id: `paint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: paintMode,
                shape: paintShape,
                hardness: paintHardness,
                opacity: paintOpacity,
                isEraser: false, // Always false for new paint
                points: [
                    { x: pos.x - paintBrushSize, y: pos.z - paintBrushSize },
                    { x: pos.x + paintBrushSize, y: pos.z - paintBrushSize },
                    { x: pos.x + paintBrushSize, y: pos.z + paintBrushSize },
                    { x: pos.x - paintBrushSize, y: pos.z + paintBrushSize }
                ],
                ...(paintMode === 'scatter' ? {
                    meshType: scatterType,
                    density: scatterDensity
                } : {
                    color: paintColor
                })
            }

            console.log('[VisualEditor] Painting area:', newArea)

            updateLevelWithHistory({
                ...levelData,
                paintedAreas: [...(levelData.paintedAreas || []), newArea]
            })
        }
    }

    // Spline operations
    const finalizeSpline = () => {
        if (splinePoints.length < 2) {
            setSplinePoints([])
            return
        }

        const newSpline: SplinePath = {
            id: editingSplineId || `spline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            controlPoints: [...splinePoints],
            meshType: splineMeshType,
            spacing: splineSpacing,
            scale: splineScale,
            closed: splineClosed,
            hasCollision: splineHasCollision
        }

        let updatedPaths: SplinePath[]
        if (editingSplineId) {
            updatedPaths = (levelData.splinePaths || []).map(s => s.id === editingSplineId ? newSpline : s)
        } else {
            updatedPaths = [...(levelData.splinePaths || []), newSpline]
        }

        updateLevelWithHistory({ ...levelData, splinePaths: updatedPaths })
        setSplinePoints([])
        setEditingSplineId(null)
    }

    const cancelSpline = () => {
        setSplinePoints([])
        setEditingSplineId(null)
    }

    const deleteSpline = (splineId: string) => {
        updateLevelWithHistory({
            ...levelData,
            splinePaths: (levelData.splinePaths || []).filter(s => s.id !== splineId)
        })
        if (selectedSplineId === splineId) setSelectedSplineId(null)
    }

    const editSpline = (splineId: string) => {
        const sp = levelData.splinePaths?.find(s => s.id === splineId)
        if (!sp) return
        setSplinePoints([...sp.controlPoints])
        setSplineMeshType(sp.meshType)
        setSplineSpacing(sp.spacing)
        setSplineScale(sp.scale)
        setSplineClosed(sp.closed)
        setSplineHasCollision(sp.hasCollision)
        setEditingSplineId(splineId)
        setEditorMode('spline')
    }

    // Pointer controls - Switched from Mouse to Pointer for better compatibility with InputManager
    const handlePointerDown = (e: React.PointerEvent) => {
        console.log('[VisualEditor] handlePointerDown Fired', {
            button: e.button,
            shift: e.shiftKey,
            mode: editorMode,
            cursorPos: cursorPosition
        })

        // Stop propagation to prevent InputManager on window from seeing this
        e.stopPropagation()

        // Recalculate cursor position if missing
        let currentCursorPos = cursorPosition
        if (!currentCursorPos) {
            currentCursorPos = getPointerWorldPosition(e)
            setCursorPosition(currentCursorPos)
        }

        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true)
            return
        }

        if (e.button === 0) { // Left click
            if (editorMode === 'mesh') {
                if (isEraser) {
                    eraseMeshAtCursor(e)
                } else {
                    placeMesh(currentCursorPos)
                }
            } else if (editorMode === 'paint') {
                lastPaintPosRef.current = currentCursorPos
                paintArea(currentCursorPos)
            } else if (editorMode === 'spline') {
                if (currentCursorPos) {
                    setSplinePoints(prev => [...prev, { x: currentCursorPos!.x, z: currentCursorPos!.z }])
                }
            } else if (editorMode === 'select') {
                // Check gizmo handles first
                if (selectedMeshId && gizmoHandlesRef.current.length > 0 && containerRef.current && cameraRef.current) {
                    const rect = containerRef.current.getBoundingClientRect()
                    const mouse = new THREE.Vector2(
                        ((e.clientX - rect.left) / rect.width) * 2 - 1,
                        -((e.clientY - rect.top) / rect.height) * 2 + 1
                    )
                    raycasterRef.current.setFromCamera(mouse, cameraRef.current)
                    const gizmoHits = raycasterRef.current.intersectObjects(gizmoHandlesRef.current)
                    if (gizmoHits.length > 0) {
                        const gizmoType = gizmoHits[0].object.userData.gizmoType as typeof draggingGizmo
                        const placement = levelData.meshPlacements?.find((m: MeshPlacement) => m.id === selectedMeshId)
                        if (placement && currentCursorPos) {
                            setDraggingGizmo(gizmoType)
                            setDragStartWorld({ x: currentCursorPos.x, z: currentCursorPos.z })
                            setDragStartMeshValues({
                                x: placement.position.x,
                                z: placement.position.z,
                                rotY: placement.rotation.y,
                                scale: placement.scale.x
                            })
                        }
                        return
                    }
                }
                selectMeshAtCursor(e)
            }
        }

        // Right-click to undo last spline point
        if (e.button === 2 && editorMode === 'spline') {
            setSplinePoints(prev => prev.slice(0, -1))
        }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isPanning) {
            const speed = 0.05 / cameraZoom
            setCameraPosition(prev => ({
                x: prev.x + e.movementX * speed,
                z: prev.z - e.movementY * speed
            }))
        } else if (draggingGizmo && dragStartWorld && dragStartMeshValues && selectedMeshId) {
            // Gizmo drag — get unsnapped world position for smooth movement
            if (!containerRef.current || !cameraRef.current || !groundRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            )
            raycasterRef.current.setFromCamera(mouse, cameraRef.current)
            const hits = raycasterRef.current.intersectObject(groundRef.current)
            if (hits.length === 0) return
            const worldPos = hits[0].point

            if (draggingGizmo === 'translate_x') {
                const dx = worldPos.x - dragStartWorld.x
                liveDragUpdateMesh(selectedMeshId, {
                    position: { x: dragStartMeshValues.x + dx, y: 0, z: dragStartMeshValues.z }
                })
            } else if (draggingGizmo === 'translate_z') {
                const dz = worldPos.z - dragStartWorld.z
                liveDragUpdateMesh(selectedMeshId, {
                    position: { x: dragStartMeshValues.x, y: 0, z: dragStartMeshValues.z + dz }
                })
            } else if (draggingGizmo === 'rotate_y') {
                const cx = dragStartMeshValues.x
                const cz = dragStartMeshValues.z
                const angle = Math.atan2(worldPos.x - cx, worldPos.z - cz)
                liveDragUpdateMesh(selectedMeshId, {
                    rotation: { x: 0, y: angle, z: 0 }
                })
            } else if (draggingGizmo === 'scale') {
                const cx = dragStartMeshValues.x
                const cz = dragStartMeshValues.z
                const startDist = Math.sqrt((dragStartWorld.x - cx) ** 2 + (dragStartWorld.z - cz) ** 2)
                const curDist = Math.sqrt((worldPos.x - cx) ** 2 + (worldPos.z - cz) ** 2)
                const ratio = startDist > 0.1 ? curDist / startDist : 1
                const newScale = Math.max(0.1, Math.min(10, dragStartMeshValues.scale * ratio))
                liveDragUpdateMesh(selectedMeshId, {
                    scale: { x: newScale, y: newScale, z: newScale }
                })
            }
        } else {
            const pos = getPointerWorldPosition(e)
            if (pos) {
                setCursorPosition(prev => {
                    if (!prev || prev.x !== pos.x || prev.z !== pos.z) {
                        return pos
                    }
                    return prev
                })

                // Continuous painting while dragging
                if (e.buttons === 1 && editorModeRef.current === 'paint') {
                    const last = lastPaintPosRef.current
                    const minDist = paintBrushSizeRef.current * 1.5
                    if (!last || (pos.x - last.x) ** 2 + (pos.z - last.z) ** 2 >= minDist * minDist) {
                        lastPaintPosRef.current = pos
                        paintArea(pos)
                    }
                }
            } else {
                setCursorPosition(null)
            }
        }
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        e.stopPropagation()

        // Commit gizmo drag to history
        if (draggingGizmo && selectedMeshId) {
            // Current levelData already has the live-updated values — push to history
            updateLevelWithHistory({ ...levelData })
            setDraggingGizmo(null)
            setDragStartWorld(null)
            setDragStartMeshValues(null)
            return
        }

        setIsPanning(false)
        lastPaintPosRef.current = null
    }

    const handlePointerLeave = () => {
        setIsPanning(false)
        setCursorPosition(null)
    }

    const handleImportMesh = (def: CustomMeshDefinition) => {
        updateLevelWithHistory({
            ...levelData,
            customMeshDefinitions: [...(levelData.customMeshDefinitions || []), def]
        })
    }

    // Helper to generate a scatter object (sphere for now)
    const generateScatterObject = (meshType: string, seed: number) => {
        // Use a seeded random for consistent scatter patterns across renders
        const random = new SeededRandom(seed.toString())

        let geometry: THREE.BufferGeometry
        let material: THREE.MeshStandardMaterial
        let objectScale = 1.0

        // Default to a sphere if type not recognized, or specific scatter types
        switch (meshType) {
            case 'grass':
                geometry = new THREE.ConeGeometry(0.1 + random.next() * 0.1, 0.4 + random.next() * 0.4, 4)
                material = new THREE.MeshStandardMaterial({ color: 0x4a7c3e, roughness: 0.8 })
                objectScale = 0.5 + random.next() * 1.5
                break
            case 'flowers':
                const group = new THREE.Group()
                // Stem
                const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4)
                const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
                const stem = new THREE.Mesh(stemGeo, stemMat)
                stem.position.y = 0.2
                group.add(stem)
                // Head
                const headGeo = new THREE.SphereGeometry(0.1, 8, 8)
                const headMat = new THREE.MeshStandardMaterial({ 
                    color: new THREE.Color().setHSL(random.next(), 0.8, 0.5) 
                })
                const head = new THREE.Mesh(headGeo, headMat)
                head.position.y = 0.4
                group.add(head)
                group.scale.setScalar(0.7 + random.next() * 0.6)
                group.traverse(c => { if(c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true } })
                return group
            case 'stones':
                geometry = new THREE.DodecahedronGeometry(0.3)
                material = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 })
                objectScale = 0.5 + random.next() * 1.0
                break
            case 'mushrooms':
                const mGroup = new THREE.Group()
                // Stem
                const mStemGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.2)
                const mStemMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee })
                const mStem = new THREE.Mesh(mStemGeo, mStemMat)
                mStem.position.y = 0.1
                mGroup.add(mStem)
                // Cap
                const capGeo = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
                const capMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 })
                const cap = new THREE.Mesh(capGeo, capMat)
                cap.position.y = 0.2
                mGroup.add(cap)
                mGroup.scale.setScalar(0.8 + random.next() * 0.5)
                mGroup.traverse(c => { if(c instanceof THREE.Mesh) { c.castShadow = true; c.receiveShadow = true } })
                return mGroup
            case 'debris':
                geometry = new THREE.BoxGeometry(0.2, 0.1, 0.4)
                material = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 1.0 })
                objectScale = 0.5 + random.next() * 1.0
                break
            case 'foliage':
                geometry = new THREE.IcosahedronGeometry(0.4, 0)
                material = new THREE.MeshStandardMaterial({ color: 0x224411, roughness: 0.8 })
                objectScale = 0.8 + random.next() * 1.2
                break
            default:
                geometry = new THREE.SphereGeometry(0.2, 8, 8)
                material = new THREE.MeshStandardMaterial({ color: 0x4a7c3e })
                break
        }

        const mesh = new THREE.Mesh(geometry, material)
        mesh.scale.setScalar(objectScale)
        mesh.rotation.set(random.next() * 0.2, random.next() * Math.PI * 2, random.next() * 0.2)
        mesh.position.y = (geometry as any).parameters?.height / 2 * objectScale || 0
        mesh.castShadow = true
        mesh.receiveShadow = true
        return mesh
    }

    if (!isVisible) return null

    return (
        <div 
            className="fixed inset-0 bg-black z-[60] flex flex-col pointer-events-auto"
        >
            {/* Top Toolbar */}
            <div className="h-14 bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-bold">{levelData.name}</span>
                    <span className="text-white/40 text-sm">Visual Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={async () => {
                        await onSave()
                        setSaveToast(true)
                        setTimeout(() => setSaveToast(false), 2000)
                    }} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                    </Button>
                    <Button size="sm" onClick={onTest} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Play className="w-4 h-4 mr-1" />
                        Test
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-16 bg-black/80 backdrop-blur-md border-r border-white/10 flex flex-col gap-2 p-2 z-[80]">
                    <ToolButton icon={Move} label="Select" active={editorMode === 'select'} onClick={() => setEditorMode('select')} />
                    <ToolButton icon={Layers} label="Meshes" active={editorMode === 'mesh'} onClick={() => setEditorMode('mesh')} />
                    <ToolButton icon={Palette} label="Paint" active={editorMode === 'paint'} onClick={() => setEditorMode('paint')} />
                    <ToolButton icon={ArrowUpRight} label="Spline" active={editorMode === 'spline'} onClick={() => setEditorMode('spline')} />
                    <ToolButton icon={Edit} label="Timeline" active={editorMode === 'timeline'} onClick={() => setEditorMode('timeline')} />
                    <div className="flex-1" />
                </div>

                {/* Canvas */}
                <div className="flex-1 relative">
                    <div
                        ref={containerRef}
                        className="absolute inset-0"
                        style={{
                            pointerEvents: 'none',
                            zIndex: 0
                        }}
                    />
                    {/* Interactive overlay to capture clicks */}
                    <div
                        ref={(el) => {
                            setOverlayElement(el)
                            if (el && !overlayElement) console.log('[VisualEditor] Overlay mounted')
                        }}
                        className="absolute inset-0"
                        role="button" // Important: bypasses InputManager's preventDefault
                        style={{
                            pointerEvents: 'auto',
                            zIndex: 50,
                            background: 'rgba(0,0,0,0.01)', // Effectively invisible but registers hits
                            cursor: draggingGizmo ? 'grabbing' : isPanning ? 'grabbing' : editorMode === 'mesh' ? 'crosshair' : editorMode === 'paint' ? 'pointer' : editorMode === 'spline' ? 'crosshair' : 'default',
                            width: '100%',
                            height: '100%'
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerLeave}
                        onDoubleClick={() => {
                            if (editorMode === 'spline' && splinePoints.length >= 2) {
                                finalizeSpline()
                            }
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    {/* Controls Overlay */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-3 space-y-2 pointer-events-auto" style={{ zIndex: 60 }}>
                        <div className="text-xs text-white/60 uppercase tracking-wider font-bold mb-2">Camera</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60 w-12">Zoom:</span>
                            <input
                                type="range"
                                min="0.01"
                                max="10"
                                step="0.01"
                                value={cameraZoom}
                                onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
                                className="w-24"
                            />
                            <span className="text-xs text-white/80 w-10">{cameraZoom.toFixed(2)}x</span>
                        </div>
                        <button
                            onClick={() => {
                                setCameraZoom(1)
                                setCameraPosition({ x: 0, z: 0 })
                            }}
                            className="w-full px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3 inline mr-1" />
                            Reset View
                        </button>
                        {cursorPosition && (
                            <div className="text-xs text-white/60 mt-2 pt-2 border-t border-white/10">
                                X: {cursorPosition.x.toFixed(1)}, Z: {cursorPosition.z.toFixed(1)}
                            </div>
                        )}
                    </div>

                    {/* Instructions Overlay */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-3 pointer-events-auto" style={{ zIndex: 60 }}>
                        <div className="text-xs text-white/60 space-y-1">
                            <div><span className="text-white/90 font-bold">Mouse Wheel:</span> Zoom</div>
                            <div><span className="text-white/90 font-bold">WASD:</span> Pan Camera</div>
                            <div><span className="text-white/90 font-bold">Middle Click/Shift+Drag:</span> Pan</div>
                            {editorMode === 'mesh' && <div><span className="text-white/90 font-bold">Left Click:</span> Place Mesh</div>}
                            {editorMode === 'paint' && <div><span className="text-white/90 font-bold">Left Click:</span> Paint</div>}
                            {editorMode === 'spline' && <>
                                <div><span className="text-white/90 font-bold">Left Click:</span> Add Point</div>
                                <div><span className="text-white/90 font-bold">Double-Click:</span> Finish</div>
                                <div><span className="text-white/90 font-bold">Esc:</span> Cancel</div>
                                <div><span className="text-white/90 font-bold">Right-Click:</span> Undo Point</div>
                            </>}
                            {editorMode === 'select' && <>
                                <div><span className="text-white/90 font-bold">Left Click:</span> Select Mesh</div>
                                <div><span className="text-white/90 font-bold">Drag Gizmo:</span> Transform</div>
                                <div><span className="text-white/90 font-bold">Arrow Keys:</span> Nudge (+Shift fine)</div>
                                <div><span className="text-white/90 font-bold">Delete:</span> Remove</div>
                            </>}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-black/80 backdrop-blur-md border-l border-white/10 overflow-y-auto z-[80]">
                    {editorMode === 'select' && (
                        <SelectModePanel
                            levelData={levelData}
                            onDeleteMesh={deleteMesh}
                            onUpdateMesh={updateMeshPlacement}
                            selectedMeshId={selectedMeshId}
                            transformMode={transformMode}
                            setTransformMode={setTransformMode}
                        />
                    )}
                    {editorMode === 'mesh' && (
                        <MeshModePanel
                            selectedMeshType={selectedMeshType}
                            setSelectedMeshType={setSelectedMeshType}
                            meshScale={meshScale}
                            setMeshScale={setMeshScale}
                            meshRotation={meshRotation}
                            setMeshRotation={setMeshRotation}
                            randomizeRotation={randomizeRotation}
                            setRandomizeRotation={setRandomizeRotation}
                            randomizeScale={randomizeScale}
                            setRandomizeScale={setRandomizeScale}
                            meshCount={levelData.meshPlacements?.length || 0}
                            customMeshes={levelData.customMeshDefinitions}
                            onAddCustomMesh={handleImportMesh}
                            isEraser={isEraser}
                            setIsEraser={setIsEraser}
                        />
                    )}
                    {editorMode === 'paint' && (
                        <PaintModePanel
                            paintMode={paintMode}
                            setPaintMode={setPaintMode}
                            scatterType={scatterType}
                            setScatterType={setScatterType}
                            scatterDensity={scatterDensity}
                            setScatterDensity={setScatterDensity}
                            paintBrushSize={paintBrushSize}
                            setPaintBrushSize={setPaintBrushSize}
                            paintColor={paintColor}
                            setPaintColor={setPaintColor}
                            areaCount={levelData.paintedAreas?.length || 0}
                            paintShape={paintShape}
                            setPaintShape={setPaintShape}
                            paintHardness={paintHardness}
                            setPaintHardness={setPaintHardness}
                            paintOpacity={paintOpacity}
                            setPaintOpacity={setPaintOpacity}
                            isEraser={isEraser}
                            setIsEraser={setIsEraser}
                        />
                    )}
                    {editorMode === 'spline' && (
                        <SplineModePanel
                            splineMeshType={splineMeshType}
                            setSplineMeshType={setSplineMeshType}
                            splineSpacing={splineSpacing}
                            setSplineSpacing={setSplineSpacing}
                            splineScale={splineScale}
                            setSplineScale={setSplineScale}
                            splineClosed={splineClosed}
                            setSplineClosed={setSplineClosed}
                            splineHasCollision={splineHasCollision}
                            setSplineHasCollision={setSplineHasCollision}
                            splinePoints={splinePoints}
                            onFinalize={finalizeSpline}
                            onCancel={cancelSpline}
                            splinePaths={levelData.splinePaths || []}
                            selectedSplineId={selectedSplineId}
                            onSelectSpline={setSelectedSplineId}
                            onDeleteSpline={deleteSpline}
                            onEditSpline={editSpline}
                            editingSplineId={editingSplineId}
                        />
                    )}
                    {editorMode === 'timeline' && (
                        <TimelineModePanel levelData={levelData} onUpdateLevel={onUpdateLevel} />
                    )}
                </div>
            </div>

            {/* Save toast */}
            {saveToast && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-[100] animate-in fade-in slide-in-from-top-2">
                    Level saved
                </div>
            )}
        </div>
    )
}

function ToolButton({ icon: Icon, label, active, onClick }: {
    icon: any
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`p-2 rounded-lg transition-all ${
                active
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
        >
            <Icon className="w-6 h-6" />
        </button>
    )
}

function SelectModePanel({
    levelData,
    selectedMeshId,
    onDeleteMesh,
    onUpdateMesh,
    transformMode,
    setTransformMode
}: {
    levelData: CustomLevelData
    selectedMeshId: string | null
    onDeleteMesh: (id: string) => void
    onUpdateMesh: (id: string, updates: Partial<MeshPlacement>) => void
    transformMode: TransformMode
    setTransformMode: (mode: TransformMode) => void
}) {
    const selectedMesh = levelData.meshPlacements?.find((m: MeshPlacement) => m.id === selectedMeshId)

    const rotDeg = selectedMesh ? Math.round((selectedMesh.rotation.y * 180 / Math.PI + 360) % 360) : 0

    return (
        <div className="p-4 space-y-4">
            <div className="text-sm text-white/60 uppercase tracking-wider font-bold mb-4">Select & Transform</div>

            {selectedMesh ? (
                <>
                    <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-3 space-y-3">
                        <div className="text-xs text-blue-300 font-bold uppercase">Selected: {selectedMesh.meshType}</div>

                        {/* Gizmo Mode Buttons */}
                        <div>
                            <label className="text-xs text-white/60 mb-1 block">Gizmo Mode</label>
                            <div className="flex gap-1">
                                <button onClick={() => setTransformMode('translate')} className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${transformMode === 'translate' ? 'bg-white/20 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'}`}>
                                    <Move className="w-3 h-3 inline mr-1" /> Move
                                </button>
                                <button onClick={() => setTransformMode('rotate')} className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${transformMode === 'rotate' ? 'bg-white/20 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'}`}>
                                    <RotateCcw className="w-3 h-3 inline mr-1" /> Rotate
                                </button>
                                <button onClick={() => setTransformMode('scale')} className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${transformMode === 'scale' ? 'bg-white/20 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'}`}>
                                    <Maximize className="w-3 h-3 inline mr-1" /> Scale
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Position */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                        <div className="text-xs text-white/60 font-bold uppercase">Position</div>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-red-400 w-4 font-bold">X</span>
                            <input type="range" min="-100" max="100" step="0.5"
                                value={selectedMesh.position.x}
                                onChange={e => onUpdateMesh(selectedMesh.id, {
                                    position: { ...selectedMesh.position, x: parseFloat(e.target.value) }
                                })}
                                className="flex-1" />
                            <input type="number" step="0.5"
                                value={parseFloat(selectedMesh.position.x.toFixed(1))}
                                onChange={e => onUpdateMesh(selectedMesh.id, {
                                    position: { ...selectedMesh.position, x: parseFloat(e.target.value) || 0 }
                                })}
                                className="w-16 px-1 py-0.5 bg-white/10 border border-white/20 rounded text-white text-xs text-right" />
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-blue-400 w-4 font-bold">Z</span>
                            <input type="range" min="-100" max="100" step="0.5"
                                value={selectedMesh.position.z}
                                onChange={e => onUpdateMesh(selectedMesh.id, {
                                    position: { ...selectedMesh.position, z: parseFloat(e.target.value) }
                                })}
                                className="flex-1" />
                            <input type="number" step="0.5"
                                value={parseFloat(selectedMesh.position.z.toFixed(1))}
                                onChange={e => onUpdateMesh(selectedMesh.id, {
                                    position: { ...selectedMesh.position, z: parseFloat(e.target.value) || 0 }
                                })}
                                className="w-16 px-1 py-0.5 bg-white/10 border border-white/20 rounded text-white text-xs text-right" />
                        </div>
                        <div className="text-[10px] text-white/30 italic">Arrow keys nudge (Shift = fine)</div>
                    </div>

                    {/* Rotation */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                        <div className="text-xs text-white/60 font-bold uppercase">Rotation</div>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-yellow-400 w-4 font-bold">Y</span>
                            <input type="range" min="0" max="360" step="1"
                                value={rotDeg}
                                onChange={e => onUpdateMesh(selectedMesh.id, {
                                    rotation: { ...selectedMesh.rotation, y: parseFloat(e.target.value) * Math.PI / 180 }
                                })}
                                className="flex-1" />
                            <span className="text-xs text-white/80 w-10 text-right">{rotDeg}°</span>
                        </div>
                        <div className="flex gap-1">
                            {[0, 45, 90, 135, 180, 270].map(deg => (
                                <button key={deg}
                                    onClick={() => onUpdateMesh(selectedMesh.id, {
                                        rotation: { ...selectedMesh.rotation, y: deg * Math.PI / 180 }
                                    })}
                                    className="flex-1 px-1 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/60 transition-colors">
                                    {deg}°
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scale */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                        <div className="text-xs text-white/60 font-bold uppercase">Scale</div>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-green-400 w-4 font-bold">S</span>
                            <input type="range" min="0.1" max="10" step="0.1"
                                value={selectedMesh.scale.x}
                                onChange={e => {
                                    const s = parseFloat(e.target.value)
                                    onUpdateMesh(selectedMesh.id, { scale: { x: s, y: s, z: s } })
                                }}
                                className="flex-1" />
                            <input type="number" step="0.1" min="0.1" max="10"
                                value={parseFloat(selectedMesh.scale.x.toFixed(1))}
                                onChange={e => {
                                    const s = Math.max(0.1, parseFloat(e.target.value) || 0.1)
                                    onUpdateMesh(selectedMesh.id, { scale: { x: s, y: s, z: s } })
                                }}
                                className="w-16 px-1 py-0.5 bg-white/10 border border-white/20 rounded text-white text-xs text-right" />
                        </div>
                        <div className="flex gap-1">
                            {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map(s => (
                                <button key={s}
                                    onClick={() => onUpdateMesh(selectedMesh.id, { scale: { x: s, y: s, z: s } })}
                                    className="flex-1 px-1 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/60 transition-colors">
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => onDeleteMesh(selectedMesh.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete (or press Delete key)
                    </Button>
                </>
            ) : (
                <div className="text-center py-8 text-white/40 text-sm">
                    Click on a mesh to select it. A gizmo will appear for translate, rotate, or scale.
                </div>
            )}

            <div className="space-y-2">
                <div className="text-xs text-white/60 uppercase tracking-wider font-bold">
                    Meshes ({levelData.meshPlacements?.length || 0})
                </div>
                <div className="text-xs text-white/40">
                    Click meshes in the scene to select them
                </div>
            </div>
        </div>
    )
}

function MeshModePanel({ 
    selectedMeshType, 
    setSelectedMeshType, 
    meshScale, 
    setMeshScale, 
    meshRotation, 
    setMeshRotation, 
    randomizeRotation,
    setRandomizeRotation,
    randomizeScale,
    setRandomizeScale,
    meshCount,
    customMeshes,
    onAddCustomMesh,
    isEraser,
    setIsEraser
}: {
    selectedMeshType: string
    setSelectedMeshType: (type: string) => void
    meshScale: number
    setMeshScale: (scale: number) => void
    meshRotation: number
    setMeshRotation: (rotation: number) => void
    randomizeRotation: boolean
    setRandomizeRotation: (val: boolean) => void
    randomizeScale: boolean
    setRandomizeScale: (val: boolean) => void
    meshCount: number
    customMeshes?: CustomMeshDefinition[]
    onAddCustomMesh?: (def: CustomMeshDefinition) => void
    isEraser: boolean
    setIsEraser: (val: boolean) => void
}) {
    const [importUrl, setImportUrl] = useState('')
    const [importName, setImportName] = useState('')

    const allMeshTypes = [
        ...MESH_TYPES.map(m => ({ id: m.id, name: m.name })),
        ...(customMeshes?.map(m => ({ id: m.id, name: m.name + ' (Custom)' })) || [])
    ]

    const handleImport = () => {
        if (!importUrl || !importName || !onAddCustomMesh) return
        onAddCustomMesh({
            id: `custom_${Date.now()}`,
            name: importName,
            url: importUrl,
            scale: 1.0
        })
        setImportUrl('')
        setImportName('')
    }

    return (
        <div className="p-4 space-y-3">
            <div className="text-sm text-white/60 uppercase tracking-wider font-bold mb-2">Mesh Placement</div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex gap-2">
                <button
                    onClick={() => setIsEraser(false)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                        !isEraser ? 'bg-blue-600 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'
                    }`}
                >
                    <Box className="w-3 h-3 inline mr-1" /> Place
                </button>
                <button
                    onClick={() => setIsEraser(true)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                        isEraser ? 'bg-red-600 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'
                    }`}
                >
                    <Trash2 className="w-3 h-3 inline mr-1" /> Erase
                </button>
            </div>

            {!isEraser && (
                <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                    <div className="text-xs text-purple-300 font-bold uppercase mb-2">Mesh Settings</div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block">Type</label>
                        <select
                            value={selectedMeshType}
                            onChange={(e) => setSelectedMeshType(e.target.value)}
                            className="w-full px-2 py-1 bg-white/20 border border-white/20 rounded text-white text-xs [&>option]:bg-zinc-900 [&>option]:text-white"
                        >
                            {allMeshTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block flex items-center justify-between">
                            Scale: {meshScale.toFixed(1)}x
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={randomizeScale} onChange={e => setRandomizeScale(e.target.checked)} className="w-3 h-3" />
                                <span className="text-[10px]">Random</span>
                            </label>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={meshScale}
                            onChange={(e) => setMeshScale(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/60 mb-1 block flex items-center justify-between">
                            Rotation: {meshRotation}°
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={randomizeRotation} onChange={e => setRandomizeRotation(e.target.checked)} className="w-3 h-3" />
                                <span className="text-[10px]">Random</span>
                            </label>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={meshRotation}
                            onChange={(e) => setMeshRotation(parseInt(e.target.value))}
                            className="w-full"
                            disabled={randomizeRotation}
                        />
                    </div>

                    <div className="text-xs text-white/40 italic pt-2 border-t border-white/10">
                        Click anywhere on the ground to place mesh
                    </div>
                </div>
            )}

            {isEraser && (
                <div className="bg-red-600/10 border border-red-400/20 rounded-lg p-3">
                    <div className="text-xs text-red-300 font-bold uppercase mb-1">Eraser Mode</div>
                    <div className="text-xs text-white/60">
                        Click on any mesh to delete it.
                    </div>
                </div>
            )}

            {/* Import Custom Mesh UI */}
            {!isEraser && (
                <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-3 space-y-2">
                    <div className="text-xs text-blue-300 font-bold uppercase mb-2 flex items-center gap-1">
                        <Link className="w-3 h-3" /> Import Mesh (GLB)
                    </div>
                    <input
                        type="text"
                        placeholder="Name (e.g. Alien Tree)"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    />
                    <input
                        type="text"
                        placeholder="URL (http://...)"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    />
                    <Button size="sm" onClick={handleImport} disabled={!importUrl || !importName} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7">
                        <Plus className="w-3 h-3 mr-1" /> Add to Library
                    </Button>
                </div>
            )}

            <div className="text-xs text-white/60">
                Placed: {meshCount} meshes
            </div>
        </div>
    )
}

function PaintModePanel({
    paintMode, setPaintMode,
    scatterType, setScatterType,
    scatterDensity, setScatterDensity,
    paintBrushSize, setPaintBrushSize,
    paintColor, setPaintColor,
    areaCount,
    paintShape, setPaintShape,
    paintHardness, setPaintHardness,
    paintOpacity, setPaintOpacity,
    isEraser, setIsEraser
}: {
    paintMode: 'scatter' | 'color'
    setPaintMode: (mode: 'scatter' | 'color') => void
    scatterType: string
    setScatterType: (type: string) => void
    scatterDensity: number
    setScatterDensity: (density: number) => void
    paintBrushSize: number
    setPaintBrushSize: (size: number) => void
    paintColor: string
    setPaintColor: (color: string) => void
    areaCount: number
    paintShape: 'circle' | 'square'
    setPaintShape: (shape: 'circle' | 'square') => void
    paintHardness: number
    setPaintHardness: (hardness: number) => void
    paintOpacity: number
    setPaintOpacity: (opacity: number) => void
    isEraser: boolean
    setIsEraser: (val: boolean) => void
}) {
    const scatterMeshTypes = [
        { id: 'grass', name: 'Grass Clumps' },
        { id: 'flowers', name: 'Flowers' },
        { id: 'stones', name: 'Small Stones' },
        { id: 'mushrooms', name: 'Mushrooms' },
        { id: 'debris', name: 'Debris' },
        { id: 'foliage', name: 'Foliage' }
    ]

    return (
        <div className="p-4 space-y-3">
            <div className="text-sm text-white/60 uppercase tracking-wider font-bold mb-2">Paint Mode</div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex gap-2">
                <button
                    onClick={() => setIsEraser(false)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                        !isEraser ? 'bg-purple-600 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'
                    }`}
                >
                    <Palette className="w-3 h-3 inline mr-1" /> Paint
                </button>
                <button
                    onClick={() => setIsEraser(true)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                        isEraser ? 'bg-red-600 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'
                    }`}
                >
                    <Trash2 className="w-3 h-3 inline mr-1" /> Erase
                </button>
            </div>

            {!isEraser && (
                <>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPaintMode('scatter')}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                paintMode === 'scatter'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                        >
                            Scatter Meshes
                        </button>
                        <button
                            onClick={() => setPaintMode('color')}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                paintMode === 'color'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                        >
                            Color Paint
                        </button>
                    </div>

                    {paintMode === 'scatter' && (
                        <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                            <div className="text-xs text-purple-300 font-bold uppercase mb-2">Scatter Settings</div>
                            <div>
                                <label className="text-xs text-white/60 mb-1 block">Mesh Type</label>
                                <select
                                    value={scatterType}
                                    onChange={(e) => setScatterType(e.target.value)}
                                    className="w-full px-2 py-1 bg-white/20 border border-white/20 rounded text-white text-xs [&>option]:bg-zinc-900 [&>option]:text-white"
                                >
                                    {scatterMeshTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/60 mb-1 block">Density: {scatterDensity}%</label>
                                <input type="range" min="10" max="100" step="5" value={scatterDensity}
                                    onChange={(e) => setScatterDensity(parseInt(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    )}

                    {paintMode === 'color' && (
                        <div className="bg-green-600/10 border border-green-400/20 rounded-lg p-3 space-y-2">
                            <div className="text-xs text-green-300 font-bold uppercase mb-2">Color Settings</div>
                            <div>
                                <label className="text-xs text-white/60 mb-1 block">Color</label>
                                <input type="color" value={paintColor}
                                    onChange={(e) => setPaintColor(e.target.value)}
                                    className="w-full h-8 rounded cursor-pointer" />
                            </div>
                            <div>
                                <label className="text-xs text-white/60 mb-1 block">Opacity: {(paintOpacity * 100).toFixed(0)}%</label>
                                <input type="range" min="0.1" max="1" step="0.05" value={paintOpacity}
                                    onChange={(e) => setPaintOpacity(parseFloat(e.target.value))} className="w-full" />
                            </div>
                            <div>
                                <label className="text-xs text-white/60 mb-1 block">Hardness: {(paintHardness * 100).toFixed(0)}%</label>
                                <input type="range" min="0" max="1" step="0.05" value={paintHardness}
                                    onChange={(e) => setPaintHardness(parseFloat(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    )}

                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                        <div className="text-xs text-white/60 font-bold uppercase mb-2">Brush</div>
                        <div>
                            <label className="text-xs text-white/60 mb-1 block">Size: {paintBrushSize}</label>
                            <input type="range" min="1" max="20" step="1" value={paintBrushSize}
                                onChange={(e) => setPaintBrushSize(parseInt(e.target.value))} className="w-full" />
                        </div>
                        <div>
                            <label className="text-xs text-white/60 mb-1 block">Shape</label>
                            <div className="flex gap-1">
                                <button onClick={() => setPaintShape('circle')}
                                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${paintShape === 'circle' ? 'bg-white/20 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'}`}>
                                    Circle
                                </button>
                                <button onClick={() => setPaintShape('square')}
                                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${paintShape === 'square' ? 'bg-white/20 text-white' : 'bg-transparent text-white/60 hover:bg-white/10'}`}>
                                    Square
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isEraser && (
                <div className="bg-red-600/10 border border-red-400/20 rounded-lg p-3">
                    <div className="text-xs text-red-300 font-bold uppercase mb-1">Eraser Mode</div>
                    <div className="text-xs text-white/60">
                        Click on painted areas to remove them.
                    </div>
                </div>
            )}

            <div className="text-xs text-white/60">
                Painted areas: {areaCount}
            </div>
        </div>
    )
}

const SPLINE_MESH_TYPES = [
    { id: 'fence_wood', name: 'Wood Fence' },
    { id: 'fence_iron', name: 'Iron Fence' },
    { id: 'wall_stone', name: 'Stone Wall' },
    { id: 'wall_brick', name: 'Brick Wall' },
    { id: 'hedge_row', name: 'Hedge' },
    { id: 'log_fence', name: 'Log Fence' },
    { id: 'fence', name: 'Fence (Classic)' },
    { id: 'wall', name: 'Wall (Classic)' },
]

function SplineModePanel({
    splineMeshType, setSplineMeshType,
    splineSpacing, setSplineSpacing,
    splineScale, setSplineScale,
    splineClosed, setSplineClosed,
    splineHasCollision, setSplineHasCollision,
    splinePoints,
    onFinalize, onCancel,
    splinePaths,
    selectedSplineId, onSelectSpline,
    onDeleteSpline, onEditSpline,
    editingSplineId
}: {
    splineMeshType: string
    setSplineMeshType: (v: string) => void
    splineSpacing: number
    setSplineSpacing: (v: number) => void
    splineScale: number
    setSplineScale: (v: number) => void
    splineClosed: boolean
    setSplineClosed: (v: boolean) => void
    splineHasCollision: boolean
    setSplineHasCollision: (v: boolean) => void
    splinePoints: { x: number, z: number }[]
    onFinalize: () => void
    onCancel: () => void
    splinePaths: SplinePath[]
    selectedSplineId: string | null
    onSelectSpline: (id: string | null) => void
    onDeleteSpline: (id: string) => void
    onEditSpline: (id: string) => void
    editingSplineId: string | null
}) {
    return (
        <div className="p-4 space-y-3">
            <div className="text-sm text-white/60 uppercase tracking-wider font-bold mb-2">Spline Tool</div>

            <div className="bg-purple-600/10 border border-purple-400/20 rounded-lg p-3 space-y-2">
                <div className="text-xs text-purple-300 font-bold uppercase mb-2">Mesh Type</div>
                <div className="grid grid-cols-2 gap-1">
                    {SPLINE_MESH_TYPES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSplineMeshType(t.id)}
                            className={`px-2 py-1.5 rounded text-xs transition-colors ${
                                splineMeshType === t.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Spacing: {splineSpacing.toFixed(1)}</label>
                    <input type="range" min="0.5" max="6" step="0.1" value={splineSpacing}
                        onChange={e => setSplineSpacing(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                    <label className="text-xs text-white/60 mb-1 block">Scale: {splineScale.toFixed(1)}x</label>
                    <input type="range" min="0.5" max="3" step="0.1" value={splineScale}
                        onChange={e => setSplineScale(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-white/80 cursor-pointer">
                        <input type="checkbox" checked={splineClosed}
                            onChange={e => setSplineClosed(e.target.checked)} className="w-3 h-3" />
                        Closed Loop
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-white/80 cursor-pointer">
                        <input type="checkbox" checked={splineHasCollision}
                            onChange={e => setSplineHasCollision(e.target.checked)} className="w-3 h-3" />
                        Collision
                    </label>
                </div>
            </div>

            {/* Current spline info */}
            <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-3 space-y-2">
                <div className="text-xs text-blue-300 font-bold uppercase">
                    {editingSplineId ? 'Editing Spline' : 'New Spline'}
                </div>
                <div className="text-xs text-white/60">
                    Points: {splinePoints.length}
                </div>
                <div className="flex gap-1">
                    <Button size="sm" onClick={onFinalize} disabled={splinePoints.length < 2}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-40">
                        Finish
                    </Button>
                    <Button size="sm" onClick={onCancel} variant="outline"
                        className="flex-1 border-white/20 text-white/80 hover:bg-white/10">
                        Cancel
                    </Button>
                </div>
            </div>

            {/* Existing splines */}
            <div className="space-y-1.5">
                <div className="text-xs text-white/60 uppercase tracking-wider font-bold">
                    Splines ({splinePaths.length})
                </div>
                {splinePaths.length === 0 ? (
                    <div className="text-center py-4 text-white/40 text-xs">
                        Click on the map to place control points
                    </div>
                ) : (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {splinePaths.map(sp => (
                            <div
                                key={sp.id}
                                onClick={() => onSelectSpline(selectedSplineId === sp.id ? null : sp.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors group ${
                                    selectedSplineId === sp.id
                                        ? 'bg-cyan-600/20 border-cyan-400/40'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <ArrowUpRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white/90 font-medium">{sp.meshType}</div>
                                    <div className="text-xs text-white/50">
                                        {sp.controlPoints.length} pts • {sp.closed ? 'Loop' : 'Open'}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditSpline(sp.id) }}
                                        className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10"
                                    >
                                        <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteSpline(sp.id) }}
                                        className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function TimelineModePanel({ levelData, onUpdateLevel }: {
    levelData: CustomLevelData
    onUpdateLevel: (level: CustomLevelData) => void
}) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="p-4">
            <div className="text-sm text-white/60 uppercase tracking-wider font-bold mb-4">
                Timeline Events ({levelData.timeline?.length || 0})
            </div>

            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {(!levelData.timeline || levelData.timeline.length === 0) ? (
                    <div className="text-center py-12 text-white/40 text-sm">
                        <Edit className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No spawn events</p>
                        <p className="text-xs mt-2">Use the main editor to add timeline events</p>
                    </div>
                ) : (
                    levelData.timeline.map((event, index) => (
                        <div
                            key={index}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-purple-300 font-bold">
                                    {formatTime(event.time)}
                                </span>
                                <span className="text-xs text-white/90">
                                    {event.count}x {event.enemyType}
                                </span>
                            </div>
                            {event.message && (
                                <div className="text-xs text-white/50 italic truncate">
                                    "{event.message}"
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
