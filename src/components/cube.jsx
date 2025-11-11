import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Square() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(3.5, 3.5, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);

    const cubeSize = 0.7;
    const gap = 0.05;
    const step = cubeSize + gap;

    const COLORS={
      posX: 0xff0000, // 오른쪽, 빨강
      negX: 0xffa500, // 왼쪽, 주황
      posY: 0xffffff, // 위, 흰색
      negY: 0xffff00, // 아래, 노랑
      posZ: 0x0000ff, // 앞, 랑
      negZ: 0x00aa00, // 뒤, 초록
      internal: 0x000000 // 내부, 검정
    }

    const cubeGeom = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const edgesGeom = new THREE.EdgesGeometry(cubeGeom);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    const materialListToDispose = [];

    for (let xi = -1; xi <= 1; xi++) {
      for (let yi = -1; yi <= 1; yi++) {
        for (let zi = -1; zi <= 1; zi++) {
          if (xi === 0 && yi === 0 && zi === 0) continue;

          const faceColors = [
            xi === 1 ? COLORS.posX : COLORS.internal,
            xi === -1 ? COLORS.negX : COLORS.internal,
            yi === 1 ? COLORS.posY : COLORS.internal,
            yi === -1 ? COLORS.negY : COLORS.internal,
            zi === 1 ? COLORS.posZ : COLORS.internal,
            zi === -1 ? COLORS.negZ : COLORS.internal,
          ];

          const materials = faceColors.map((col) =>
            new THREE.MeshStandardMaterial({
              color: col,
              metalness: 0.1,
              roughness: 0.6
            })
          );
          materialListToDispose.push(...materials);

          const cube = new THREE.Mesh(cubeGeom, materials);
          cube.position.set(xi * step, yi * step, zi * step);
          scene.add(cube);

          const line = new THREE.LineSegments(edgesGeom, edgeMaterial);
          line.position.copy(cube.position);
          scene.add(line);
        }
      }
    }

    let frameId;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    camera.position.z = 4;
    renderer.render(scene, camera);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);

      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry && obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material && obj.material.dispose();
          }
        }
        if (obj.isLineSegments) {
          obj.geometry && obj.geometry.dispose();
          obj.material && obj.material.dispose();
        }
      });

      materialListToDispose.forEach((m) => {
        try { m.dispose(); } catch (e) {}
      });

      try { edgesGeom.dispose(); } catch(e) {}
      try { edgeMaterial.dispose(); } catch(e) {}
      try { cubeGeom.dispose(); } catch(e) {}

      renderer.dispose();
      if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
    };
  }, []);


  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    />
  );
}
