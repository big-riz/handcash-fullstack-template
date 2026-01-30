import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
const cache = new Map<string, THREE.Group>()
const pending = new Map<string, Promise<THREE.Group>>()

export function loadWeaponModel(url: string): Promise<THREE.Group> {
    const cached = cache.get(url)
    if (cached) return Promise.resolve(cached.clone())

    const inflight = pending.get(url)
    if (inflight) return inflight.then(m => m.clone())

    const promise = new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                const model = gltf.scene
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                })
                cache.set(url, model)
                pending.delete(url)
                resolve(model.clone())
            },
            undefined,
            (err) => {
                pending.delete(url)
                console.warn(`[WeaponModelLoader] Failed to load ${url}`, err)
                reject(err)
            }
        )
    })

    pending.set(url, promise)
    return promise
}

export function disposeWeaponModel(model: THREE.Object3D) {
    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose())
            } else if (child.material) {
                child.material.dispose()
            }
        }
    })
}

export const WEAPON_GLB_URLS: Record<string, string> = {
    lada: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769533192/new_lada_xcdqjr.glb',
    flying_lada: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769533192/new_lada_xcdqjr.glb',
    haunted_lada: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769119256/haunted_lada_h67eyt.glb',
    big_biz_lada: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769102055/big_biz_lada_drbxdj.glb',
    gopnik_gondola: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769102121/Gopnik_gondola_mibozv.glb',
    dadushka_chair: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769102118/Dadushka_chair_li6kqt.glb',
    tank_stroller: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769120403/tank_stroller_eybwod.glb',
    orbital_tank: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769120403/tank_stroller_eybwod.glb',
    immortal_lada: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769119256/haunted_lada_h67eyt.glb',
    propaganda_tower: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769120396/Propaganda_tower_he0qr9.glb',
    kvass_reactor: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769102209/Kvass_reactor_ad0s1p.glb',
    propaganda_storm: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769120396/Propaganda_tower_he0qr9.glb',
    nuclear_pigeon: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769102211/nuclear_pidgeon_jwighj.glb',
    vampire_rat: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769170615/Vampire_Rat_y7gmgc.glb',
    pig_luggage: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769120395/Pig_luggage_pcu4xl.glb',
    death_pigeon: 'https://res.cloudinary.com/dcerwavw6/image/upload/v1769102211/nuclear_pidgeon_jwighj.glb',
}
