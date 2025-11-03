<template>
  <div class="file-upload-component">
    <div class="upload-area" :class="{ 'drag-over': isDragging }">
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="handleFileSelect"
        class="d-none"
      />

      <div
        class="upload-content text-center p-4"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <i class="bi bi-cloud-upload fs-1 text-primary mb-3"></i>
        <h6 class="mb-2">{{ title }}</h6>
        <p class="text-muted small mb-3">{{ description }}</p>
        <button type="button" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-folder2-open me-2"></i>
          Choose File{{ multiple ? "s" : "" }}
        </button>
      </div>
    </div>

    <div v-if="files.length > 0" class="uploaded-files mt-3">
      <h6 class="small fw-semibold mb-2">Uploaded Files:</h6>
      <div class="list-group">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          <div class="d-flex align-items-center">
            <i class="bi bi-file-earmark-text text-primary me-2"></i>
            <div>
              <div class="fw-semibold small">{{ file.name }}</div>
              <div class="text-muted" style="font-size: 0.75rem">
                {{ formatFileSize(file.size) }}
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            @click="removeFile(index)"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="uploading" class="upload-progress mt-3">
      <div class="progress">
        <div
          class="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          :style="{ width: uploadProgress + '%' }"
        >
          {{ uploadProgress }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "../composables/useToast";

const toast = useToast();

const props = defineProps({
  title: {
    type: String,
    default: "Upload Files",
  },
  description: {
    type: String,
    default: "Drag and drop files here or click to browse",
  },
  accept: {
    type: String,
    default: "*",
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024, // 5MB
  },
  // initialFiles: array of { name, size, url } for files already uploaded
  initialFiles: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["files-selected", "upload-complete"]);

const fileInput = ref(null);
// files will contain both File objects (new) and uploaded file metadata { name, size, url }
const files = ref([...props.initialFiles]);
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files);
  addFiles(selectedFiles);
  // reset input so the same file can be selected again later
  try {
    event.target.value = "";
  } catch (e) {}
};

const handleDrop = (event) => {
  isDragging.value = false;
  const droppedFiles = Array.from(event.dataTransfer.files);
  addFiles(droppedFiles);
};

const addFiles = (newFiles) => {
  const validFiles = newFiles.filter((file) => {
    if (file.size > props.maxSize) {
      toast.warning(
        `File ${file.name} is too large. Maximum size is ${formatFileSize(
          props.maxSize
        )}`,
        "File Too Large"
      );
      return false;
    }
    return true;
  });

  if (props.multiple) {
    files.value = [...files.value, ...validFiles];
  } else {
    files.value = validFiles.slice(0, 1);
  }

  emit("files-selected", files.value);
};

const removeFile = (index) => {
  files.value.splice(index, 1);
  emit("files-selected", files.value);
};

const downloadFile = (file) => {
  if (file && file.url) {
    window.open(file.url, "_blank");
  } else {
    toast.warning(
      "File not yet uploaded. Save the assignment to upload files",
      "File Not Available"
    );
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Simulate upload (replace with actual Firebase upload)
const simulateUpload = () => {
  uploading.value = true;
  uploadProgress.value = 0;

  const interval = setInterval(() => {
    uploadProgress.value += 10;
    if (uploadProgress.value >= 100) {
      clearInterval(interval);
      uploading.value = false;
      emit("upload-complete", files.value);
    }
  }, 200);
};

defineExpose({
  simulateUpload,
});
</script>

<style scoped>
.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #0d6efd;
}

.upload-area.drag-over {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.upload-content {
  padding: 2rem;
}

.uploaded-files .list-group-item {
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
