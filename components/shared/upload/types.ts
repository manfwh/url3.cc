export type UploadFile = {
  uid: string;
  file?: File;
  name: string;
  size?: number;
  status: 'ready' | 'uploading' | 'done' | 'error';
  url?: string;
  thumb?: string;
  result?: any;
}

export type UploadedFile = Omit<UploadFile, 'uid'>
