import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { Tree, Dropdown, Menu, message, Modal, Upload, Button } from "antd";

import {
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FolderFilled,
  FilePdfFilled,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  VideoCameraOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import { getPageTitle, APP_CONFIG } from "../config/constants";
import { useAuth } from "../context/AuthContext";

import {
  useGetDocumentFoldersListQuery,
  useAddFoldersMutation,
  useDeleteFoldersMutation,
  useAddFilesMutation,
  useDeleteFilesMutation,
} from "../store/api/historyCards.api";

import "./Documents.css";

export default function Documents() {

  const { user } = useAuth();
  const clientId = user?.client?.id || user?.clientId;

  const [treeData, setTreeData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [fileRootName, setFileRootName] = useState("");

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [fileList, setFileList] = useState([]);

  const { data, refetch } = useGetDocumentFoldersListQuery(
    { clientId },
    { skip: !clientId }
  );

  const [addFolders] = useAddFoldersMutation();
  const [deleteFolders] = useDeleteFoldersMutation();
  const [addFiles] = useAddFilesMutation();
  const [deleteFiles] = useDeleteFilesMutation();

  useEffect(() => {
    if (data) {
      const result = data.data.content;

      const tree = buildTree(result);
      setTreeData(tree);

      if (result.length > 0) {
        setFilesList(result[0].fileMap);
        setFileRootName(result[0].folderName);
      }
    }
  }, [data]);

  const buildTree = (folders, parentId = null) => {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        title: `${f.folderName} (${f.fileMap.length})`,
        key: f.id,
        id: f.id,
        icon: <FolderFilled style={{ color: "#f4b400" }} />,
        fileMap: f.fileMap,
        children: buildTree(folders, f.id),
      }));
  };

  const getFileIcon = (type) => {
    if (type?.includes("pdf")) return <FilePdfFilled style={{ color: "#e53935" }} />;
    if (type?.includes("image")) return <FileImageOutlined style={{ color: "#1890ff" }} />;
    if (type?.includes("word")) return <FileWordOutlined style={{ color: "#2b579a" }} />;
    if (type?.includes("excel")) return <FileExcelOutlined style={{ color: "#217346" }} />;
    if (type?.includes("video")) return <VideoCameraOutlined style={{ color: "#722ed1" }} />;
    return <FileOutlined />;
  };

  const onSelect = (_, info) => {
    const node = info.node;
    setSelectedNode(node);
    setFileRootName(node.title.split(" (")[0]);
    setFilesList(node.fileMap);
  };

  const handleRightClick = ({ node }) => {
    setSelectedNode(node);
    setFileRootName(node.title.split(" (")[0]);
    setFilesList(node.fileMap);
  };

  const handleAddFolder = async () => {

    const payload = {
      ...(selectedNode?.id && { parentId: selectedNode.id }),
      clientId,
      folderName,
    };

    try {
      const response = await addFolders(payload).unwrap();
      message.success(response?.message || "Folder saved successfully");
      setShowFolderModal(false);
      setFolderName("");
      refetch();
    } catch (error) {
      message.error("Failed to save folder");
    }
  };

  const handleUpdateFolder = async () => {

    const payload = {
      id: selectedNode.id,
      clientId,
      folderName,
    };

    try {
      const response = await addFolders(payload).unwrap();
      message.success(response?.message || "Folder updated successfully");
      setShowFolderModal(false);
      refetch();
    } catch (error) {
      message.error("Failed to update folder");
    }
  };

  const confirmDeleteFolder = () => {
    Modal.confirm({
      title: "Delete Folder?",
      onOk: async () => {
        try {
          await deleteFolders({ id: selectedNode.id }).unwrap();
          message.success("Folder deleted");
          refetch();
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  const handleUpload = async () => {

    for (let file of fileList) {

      const formData = new FormData();

      formData.append("fileFolderId", selectedNode.id);
      formData.append("clientId", clientId);
      formData.append("files", file.originFileObj);

      await addFiles(formData);
    }

    message.success("Files uploaded");

    setShowUploadModal(false);
    setFileList([]);

    refetch();
  };

  const confirmDeleteFile = (id) => {

    Modal.confirm({
      title: "Delete File?",
      onOk: async () => {
        await deleteFiles({ id }).unwrap();
        message.success("File deleted");
        refetch();
      },
    });

  };

  const menu = (
    <Menu
      items={[
        {
          key: "create",
          label: "Create Folder",
          icon: <FolderAddOutlined />,
          onClick: () => {
            setEditMode(false);
            setFolderName("");
            setShowFolderModal(true);
          },
        },
        {
          key: "edit",
          label: "Edit Folder",
          icon: <EditOutlined />,
          onClick: () => {
            setEditMode(true);
            setFolderName(selectedNode.title.split(" (")[0]);
            setShowFolderModal(true);
          },
        },
        {
          key: "upload",
          label: "Add File",
          icon: <UploadOutlined />,
          onClick: () => setShowUploadModal(true),
        },
        {
          key: "delete",
          label: "Delete",
          icon: <DeleteOutlined />,
          onClick: confirmDeleteFolder,
        },
      ]}
    />
  );

  return (
    <>
      <Helmet>
        <title>{getPageTitle("documents")}</title>
        <meta
          name="description"
          content={`${APP_CONFIG.name} - Document Management`}
        />
      </Helmet>

      <Typography sx={{ mb: 2, color: "#777" }}>
        *Select Folder Root → Right Click to Add/Edit/Delete Folder. Select folder
        to view files.
      </Typography>

      <Box sx={{ display: "flex", gap: 3, height: "calc(100vh - 140px)" }}>

        {/* LEFT PANEL */}

        <Card sx={{ width: "40%", display: "flex", flexDirection: "column" }}>

          <Box
            sx={{
              p: 2,
              backgroundColor: "#b1acac",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">Folder Root</Typography>

            <Button
              icon={<FolderAddOutlined />}
              onClick={() => {
                setSelectedNode(null);
                setEditMode(false);
                setShowFolderModal(true);
              }}
            >
              Add Root
            </Button>
          </Box>

          <CardContent sx={{ flex: 1, overflowY: "auto" }}>
            <Dropdown overlay={menu} trigger={["contextMenu"]}>
              <div>
                <Tree
                  showIcon
                  treeData={treeData}
                  onSelect={onSelect}
                  onRightClick={handleRightClick}
                />
              </div>
            </Dropdown>
          </CardContent>
        </Card>

        {/* RIGHT PANEL */}

        <Card sx={{ width: "60%", display: "flex", flexDirection: "column" }}>

          <Box sx={{ p: 2, backgroundColor: "#b1acac", color: "#fff" }}>
            <Typography variant="h6">
              Files List - {fileRootName}
            </Typography>
          </Box>

          <CardContent sx={{ flex: 1, overflowY: "auto" }}>

            {filesList.length === 0 && (
              <Typography sx={{ textAlign: "center", mt: 3 }}>
                No Files
              </Typography>
            )}

            {filesList.map((file) => (
              <div key={file.files.id} className="file-row">

                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {getFileIcon(file.files.fileType)}
                  {file.files.name}
                </span>

                <div>

                  <Button
                    type="link"
                    onClick={() =>
                      window.open(`/unsecure/download/${file.files.id}`, "_self")
                    }
                  >
                    <DownloadOutlined />
                  </Button>

                  <Button
                    type="link"
                    danger
                    onClick={() => confirmDeleteFile(file.files.id)}
                  >
                    <DeleteOutlined />
                  </Button>

                </div>

              </div>
            ))}

          </CardContent>
        </Card>
      </Box>

      {/* CREATE / EDIT FOLDER */}

      <Modal
        open={showFolderModal}
        title={editMode ? "Edit Folder" : "Create Folder"}
        onOk={editMode ? handleUpdateFolder : handleAddFolder}
        onCancel={() => setShowFolderModal(false)}
      >

        <input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Folder Name"
          style={{ width: "100%", padding: 8 }}
        />

      </Modal>

      {/* UPLOAD FILE */}

      <Modal
        open={showUploadModal}
        title="Upload Files"
        onOk={handleUpload}
        onCancel={() => setShowUploadModal(false)}
      >

        <Upload
          multiple
          beforeUpload={() => false}
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>

      </Modal>

    </>
  );
}