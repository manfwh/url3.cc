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
  const fileSuffix = fileName.substring(fileName.lastIndexOf('.') + 1)
  return fileSuffix
}

// File to ArrayBuffer
export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer > => {
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
