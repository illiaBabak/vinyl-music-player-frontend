import { useEffect, useRef } from "react";
import {
  AbstractMesh,
  ArcRotateCamera,
  Camera,
  Engine,
  ImportMeshAsync,
  Scene,
  Vector3,
  HemisphericLight,
  Color4,
  Texture,
  PBRMaterial,
  Space,
  TransformNode,
  MeshBuilder,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import { Track } from "src/types";

type Imported = { root: AbstractMesh; mesh: AbstractMesh };

const TARGET_SIZE = 2;

const importModuleToScene = async (
  module: string,
  scene: Scene
): Promise<Imported | null> => {
  const res = await ImportMeshAsync(module, scene, {
    pluginExtension: ".glb",
  });

  const mesh = res.meshes.find((mesh) => mesh.getTotalVertices() > 0);

  if (!mesh) return null;

  mesh.computeWorldMatrix(true);

  const { min, max } = mesh.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);

  const maxDim = Math.max(size.x, size.y, size.z);

  const root = res.meshes[0];

  if (maxDim <= 1e-6) return { root, mesh };

  const scale = TARGET_SIZE / maxDim;

  root.scaling = new Vector3(scale, scale, scale);
  root.computeWorldMatrix(true);

  return { root, mesh };
};

const changePosition = (mesh: AbstractMesh, position: Vector3) => {
  mesh.position.copyFrom(position);
  mesh.computeWorldMatrix(true);
};

const changeScale = (mesh: AbstractMesh, scale: number) => {
  mesh.scaling.y = scale;
  mesh.scaling.x = scale;
  mesh.scaling.z = scale;
  mesh.computeWorldMatrix(true);
};

const placeCenterOnDisc = (disc: Imported, center: Imported) => {
  disc.mesh.computeWorldMatrix(true);
  center.mesh.computeWorldMatrix(true);

  const discBB = disc.mesh.getHierarchyBoundingVectors(true);
  const centerBB = center.mesh.getHierarchyBoundingVectors(true);

  const discCenterXZ = discBB.min.add(discBB.max).scale(0.5);
  const centerCenter = centerBB.min.add(centerBB.max).scale(0.5);

  const dx = discCenterXZ.x - centerCenter.x;
  const dz = discCenterXZ.z - centerCenter.z;
  center.root.position.addInPlace(new Vector3(dx, 0, dz));

  const discTopY = discBB.max.y;

  const centerBB2 = center.mesh.getHierarchyBoundingVectors(true);
  const centerBottomY = centerBB2.min.y;

  const dy = discTopY - centerBottomY + 0.001;
  center.root.position.addInPlace(new Vector3(0, dy, 0));

  center.root.computeWorldMatrix(true);
};

type Props = {
  selectedTrack: Track | null;
};

export const Vinyl = ({ selectedTrack }: Props) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene>(null);
  const engine = useRef<Engine>(null);
  const camera = useRef<Camera>(null);
  const light = useRef<HemisphericLight>(null);
  const centerMeshRef = useRef<Imported | null>(null);

  // Initialize Babylon.js
  useEffect(() => {
    const canvasElement = canvas.current;

    if (!canvasElement || engine.current) return;

    engine.current = new Engine(canvasElement, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      alpha: true,
    });
    scene.current = new Scene(engine.current);
    scene.current.clearColor = new Color4(0, 0, 0, 0);

    engine.current.runRenderLoop(() => {
      scene.current?.render();
    });

    camera.current = new ArcRotateCamera(
      "camera",
      Math.PI / 0.62,
      Math.PI / 3,
      2.15,
      new Vector3(0.22, 3.7, 0),
      scene.current
    );

    camera.current.attachControl(canvasElement, true);

    light.current = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      scene.current
    );

    light.current.intensity = 0.9;

    // scene.current?.debugLayer.show({
    //   embedMode: true,
    // });

    return () => {
      engine.current?.dispose();
      engine.current = null;
      camera.current = null;
    };
  }, [canvas]);

  useEffect(() => {
    const sceneElement = scene.current;

    if (!sceneElement || centerMeshRef.current) return;

    const loadModules = async () => {
      const worldRoot = new TransformNode("worldRoot", sceneElement);

      worldRoot.scaling = new Vector3(-1, 1, 1);

      worldRoot.computeWorldMatrix(true);

      const discMesh = await importModuleToScene(
        "/vinyl-model/disc.glb",
        sceneElement
      );

      if (!discMesh) return;

      const centerMesh = await importModuleToScene(
        "/vinyl-model/center.glb",
        sceneElement
      );

      if (!centerMesh) return;
      centerMeshRef.current = centerMesh;

      changeScale(centerMesh.root, 3.3);
      changeScale(discMesh.root, 8);

      const discCoords = { x: -0.055, y: 2.455, z: -0.7 };

      changePosition(
        discMesh.root,
        new Vector3(discCoords.x, discCoords.y, discCoords.z)
      );
      changePosition(
        centerMesh.root,
        new Vector3(discCoords.x, discCoords.y, discCoords.z)
      );

      placeCenterOnDisc(discMesh, centerMesh);

      const tonearmMesh = await importModuleToScene(
        "/vinyl-model/tonearm.glb",
        sceneElement
      );

      if (!tonearmMesh) return;

      changeScale(tonearmMesh.root, 4);
      changePosition(tonearmMesh.root, new Vector3(-0.79, -0.48, 0.88));

      // const t = MeshBuilder.CreateBox("t", { size: 0.05 }, sceneElement);
      // changePosition(t, new Vector3(-0.749, 3.45, 0.85));
      // t.computeWorldMatrix(true);

      const pivotNode = new TransformNode("pivot", sceneElement);
      pivotNode.position = new Vector3(-0.749, 3.45, 0.85);
      pivotNode.parent = worldRoot;
      pivotNode.computeWorldMatrix(true);

      tonearmMesh.root.parent = pivotNode;

      tonearmMesh.root.rotationQuaternion = null;
      tonearmMesh.root.computeWorldMatrix(true);

      pivotNode.rotate(Vector3.Up(), Math.PI / 1.28, Space.WORLD);

      const vinylMesh = await importModuleToScene(
        "/vinyl-model/vinyl.glb",
        sceneElement
      );

      if (!vinylMesh) return;

      vinylMesh.root.rotation.x = Math.PI;

      changePosition(vinylMesh.root, new Vector3(0, 2.97, 0));

      // t.parent = worldRoot;
      discMesh.root.parent = worldRoot;
      centerMesh.root.parent = worldRoot;
      vinylMesh.root.parent = worldRoot;
    };

    loadModules();
  }, [scene]);

  useEffect(() => {
    if (!centerMeshRef.current || !selectedTrack || !scene.current) return;

    const texture = new Texture(selectedTrack.previewPath, scene.current);
    texture.uScale = 5;
    texture.vScale = 5;

    const material = new PBRMaterial("material", scene.current);
    material.albedoTexture = texture;
    material.metallic = 0;

    centerMeshRef.current.root.getChildMeshes().forEach((m) => {
      if (m.getTotalVertices() > 0) m.material = material;
    });
  }, [selectedTrack, centerMeshRef, scene]);

  return (
    <div className="h-full flex-1 w-[70%]">
      <canvas
        className="hover:cursor-grab focus:outline-0"
        style={{ width: "100%", height: "100%" }}
        ref={canvas}
      />
    </div>
  );
};
