"use client";
import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const Page = () => {
  const mountRef = useRef(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const newScene = new THREE.Scene();
    const newCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const newRenderer = new THREE.WebGLRenderer({ alpha: true });

    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newRenderer.setClearColor(0x505050, 1);
    mountRef.current.appendChild(newRenderer.domElement);

    // Add lights to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
    newScene.add(ambientLight);

    // Camera position
    newCamera.position.set(0, 10, 20);

    // Orbit controls
    const controls = new OrbitControls(newCamera, newRenderer.domElement);

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };

    controls.enableDamping = true;
    controls.enablePan = true;
    controls.minDistance = 10;
    controls.maxDistance = 35;
    controls.maxPolarAngle = Math.PI / 2 - 0.2; // prevent camera below ground
    controls.minPolarAngle = Math.PI / 4; // prevent top down view
    controls.update();

    const hdriLoader = new RGBELoader();
    hdriLoader.load("environment.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      newScene.background = texture;
      newScene.environment = texture;
    });

    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    gltfLoader.setDRACOLoader(dracoLoader);

    // Base model
    gltfLoader.load("model-transformed.glb", (gltf) => {
      const mesh = gltf.scene;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.traverse((child) => {
        if (child.material) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.envMapIntensity = 1;
        }
      });
      mesh.name = "Base Model";
      newScene.add(mesh);

      const fontLoader = new FontLoader();
      fontLoader.load("helvetiker_regular.typeface.json", (font) => {
        const textGeometry = new TextGeometry("@identicals_ff", {
          font: font,
          size: 0.5,
          depth: 0.2,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 5,
        });

        textGeometry.center(); // Center the text geometry
        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0xa4eeea,
          roughness: 2,
          metalness: 1,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Position text
        textMesh.position.set(-14, 5.3, 0.7);
        textMesh.rotateY(-320 * (Math.PI / 180)); // Convert degrees to radians for rotation
        textMesh.castShadow = true; // Enable shadow casting
        textMesh.receiveShadow = true; // Enable shadow reception
        textMesh.wireframe = true;
        textMesh.name = "InfoText";
        newScene.add(textMesh);
      });
    });

    // Update state
    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      newRenderer.render(newScene, newCamera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      mountRef.current.removeChild(newRenderer.domElement);
      newRenderer.dispose(); // Dispose of the renderer
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [camera, renderer]);

  return (
    <div className="flex">
      <div className="w-full" ref={mountRef}></div>

      <div className="absolute bottom-5 left-5 bg-black bg-opacity-70 rounded-lg flex flex-col justify-center items-center p-2 text-white">
        Get yours, contact Instagram @identicals_ff
      </div>
    </div>
  );
};

export default Page;
