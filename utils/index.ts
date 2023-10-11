import { ArrayBuffer as SparkMD5ArrayBuffer } from 'spark-md5'
export const getFileMd5 = (file: File): Promise<string> => {
  // @ts-ignore
  const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
  const chunkSize = 2097152 // Read in chunks of 2MB
  const chunks = Math.ceil(file.size / chunkSize)
  let currentChunk = 0
  const spark = new SparkMD5ArrayBuffer()
  const fileReader = new FileReader()
  return new Promise((resolve, reject) => {
    fileReader.onload = function (e) {
      if (e.target) {
        spark.append(e.target.result as ArrayBuffer) // Append array buffer
        currentChunk++
      } else {
        reject(new Error('oops, something went wrong.'))
      }

      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }
    fileReader.onerror = function () {
      console.warn('oops, something went wrong.')
    }

    function loadNext () {
      const start = currentChunk * chunkSize
      const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize

      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    loadNext()
  })
}

// 获取文件后缀名
export const getFileSuffix = (fileName: string) => {
  const lastIndexOf = fileName.lastIndexOf('.')
  if (lastIndexOf === -1) {
    return ''
  }
  const fileSuffix = fileName.substring(lastIndexOf + 1)
  return fileSuffix
}

// File to ArrayBuffer
export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as ArrayBuffer)
    }
    reader.onerror = (err) => {
      reject(err)
    }
    reader.readAsArrayBuffer(file)
  })
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = (err) => {
      reject(err)
    }
    reader.readAsDataURL(file)
  })
}

// isImgExt
export const isImgExt = (fileName: string) => {
  const fileSuffix = getFileSuffix(fileName)
  const imgExt = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tif', 'psd', 'svg', 'tga', 'ico', 'raw', 'bpg', 'jxr', 'hdp', 'hdp', 'heif', 'heic', 'indd', 'indt', 'eps', 'ps', 'svgz', 'ind', 'indb']
  return imgExt.includes(fileSuffix)
}

// getFilename
export const getFilename = (fileName: string) => {
  const lastIndexOf = fileName.lastIndexOf('.')
  return fileName.slice(0, lastIndexOf)
}
