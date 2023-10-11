export type UploadFile = {
  uid: string;
  file?: File;
  name: string;
  size: number;
  status: 'ready' | 'uploading' | 'done' | 'error';
  thumb?: string;
  result?: any;
}
