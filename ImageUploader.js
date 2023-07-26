import { LightningElement, track, api } from 'lwc';
import saveFile from '@salesforce/apex/ImageUploaderHandler.saveFile';
import setImageUrl from '@salesforce/apex/ImageUploaderHandler.setImageUrl';
import deleteFiles from '@salesforce/apex/ImageUploaderHandler.deleteFiles';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { RefreshEvent } from "lightning/refresh";

export default class ImageUploader extends LightningElement {
  @api recordId;
  @track data;
  @track fileName = '';
  @track showLoadingSpinner = false;
  @track isTrue = false;
  @track isDelete = false;
  filesUploaded = [];
  file;
  fileContents;
  fileReader;
  content;
  MAX_FILE_SIZE = 1500000;
  @track showDiv1 = true;
  @track showDiv2 = false;
  @track imageUrl;
  @track isDelete = false;
  @track isFile = false;
  @api showFooter = false;

  connectedCallback() {
    this.populateImageUrl();
  }

  handleFilesChange(event) {
    this.fileName = '';
    if (event.target.files.length > 0) {
      if (event.target.files[0].type != 'image/jpeg' && event.target.files[0].type != 'image/png') {
        this.fileName = 'Invalid file type!!';
        this.isFile = true;
        this.isTrue = true;
      } else {
        this.isTrue = false;
        this.filesUploaded = event.target.files;
        this.fileName = event.target.files[0].name;
        this.isFile = true;
      }
    }
  }

  handleSave() {
    if (this.filesUploaded.length > 0) {
      this.uploadHelper();
      this.isFile = true
    } else {
      
      this.fileName = 'Please select a file to upload!!';
      this.isFile = false;
    }
  }

  handleReplace() {
    if (this.filesUploaded.length > 0) {
      deleteFiles({ recordId: this.recordId })
        .then(data => {
          console.log(data);
          this.uploadHelper();
        })
        .catch(error => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: 'Error!',
              message: error.message,
              variant: 'error',
            }),
          );
          this.fileName = '';
          this.isTrue = false;
          this.showLoadingSpinner = false;
          this.filesUploaded = [];
        });
    } else {
      this.isFile = true
      this.fileName = 'Please select a file to upload!!';
      this.isFile = false;
    }
  }

  uploadHelper() {
    let imageFile = null;

    // Find the first image in the filesUploaded array
    for (let i = 0; i < this.filesUploaded.length; i++) {
        if (this.filesUploaded[i].type.startsWith('image/')) {
            imageFile = this.filesUploaded[i];
            break;
        }
    }

    if (!imageFile) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error!!',
                message: 'No image file found in the uploaded files.',
                variant: 'error',
            }),
        );
        return;
    }

    // Process the image file
    this.file = imageFile;

    // The rest of the code remains the same as before
    if (this.file.size > this.MAX_FILE_SIZE) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error!!!',
                message: 'File Size is too large',
                variant: 'error',
            }),
        );
        return;
    }

    this.isTrue = true;
    this.isDelete = true;
    this.isFile = false;
    this.showLoadingSpinner = true;
    this.fileReader = new FileReader();
    this.fileReader.onloadend = (() => {
        this.fileContents = this.fileReader.result;
        let base64 = 'base64,';
        this.content = this.fileContents.indexOf(base64) + base64.length;
        this.fileContents = this.fileContents.substring(this.content);
        this.saveToFile();
    });
    this.fileReader.readAsDataURL(this.file);
}


  saveToFile() {
    saveFile({ recordId: this.recordId, strFileName: this.file.name, base64Data: encodeURIComponent(this.fileContents) })
      .then(result => {
        this.imageUrl = this.data;
       // this.fileName = this.fileName + ' - Uploaded Successfully';
        this.isTrue = false;
        this.isDelete = false;
        this.showLoadingSpinner = false;
        this.filesUploaded = [];
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success!!',
            message: this.file.name + ' - Uploaded Successfully!!!',
            variant: 'success',
          }),
        );
        // Refresh the data after successful upload
        this.populateImageUrl();
        this.dispatchEvent(new RefreshEvent());
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error while uploading File',
            message: error.message,
            variant: 'error',
          }),
        );
        this.fileName = '';
        this.isTrue = false;
        this.isDelete = false;
        this.showLoadingSpinner = false;
        this.filesUploaded = [];
      });
  }

  populateImageUrl() {
    setImageUrl({ recordId: this.recordId }).then(data => {
      this.data = data;
      console.log(data);
      if (data) {
        this.imageUrl = data;
        this.showDiv1 = false;
        this.showDiv2 = true;
        this.isDelete = true;
      }
    }).catch(error => {

    });
  }

  handleRemovePicture() {
    deleteFiles({ recordId: this.recordId })
      .then(data => {
        console.log(data);
        this.imageUrl = null; 
        this.showDiv1 = true; 
        this.showDiv2 = false;
        this.isTrue = true;
        this.isDelete = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success!!',
            message: 'Image Deleted Successfully!!!',
            variant: 'success',
          }),
        );
        this.dispatchEvent(new RefreshEvent());
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error!!!!!',
            message: error.message,
            variant: 'error',
          }),
        );
      });
      this.dispatchEvent(new RefreshEvent());
  }



  // ... (any other methods or lifecycle hooks)
}
