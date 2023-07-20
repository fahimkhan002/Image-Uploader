import { LightningElement, track, api } from 'lwc';
import saveFile from '@salesforce/apex/ImageUploaderHandler.saveFile';
import setImageUrl from '@salesforce/apex/ImageUploaderHandler.setImageUrl';
import deleteFiles from '@salesforce/apex/ImageUploaderHandler.deleteFiles';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
  @api showFooter = false;

  connectedCallback() {
    this.populateImageUrl();
  }

  handleFilesChange(event) {
    this.fileName = '';
    if (event.target.files.length > 0) {
      if (event.target.files[0].type != 'image/jpeg' && event.target.files[0].type != 'image/png') {
        this.fileName = 'Invalid file type!!';
        this.isTrue = true;
      } else {
        this.isTrue = false;
        this.filesUploaded = event.target.files;
        this.fileName = event.target.files[0].name;
      }
    }
  }

  handleSave() {
    if (this.filesUploaded.length > 0) {
      this.uploadHelper();
    } else {
      this.fileName = 'Please select a file to upload!!';
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
              title: 'Error!!',
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
      this.fileName = 'Please select a file to upload!!';
    }
  }

  uploadHelper() {
    this.file = this.filesUploaded[0];
    if (this.file.size > this.MAX_FILE_SIZE) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'File Size is too large',
          variant: 'error',
        }),
      );
      return;
    }
    this.isTrue = true;
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
        //this.fileName = this.fileName + ' - Uploaded Successfully';
        this.isTrue = false;
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
      }
    }).catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error!!',
          message: error.message,
          variant: 'error',
        }),
      );
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
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success!!',
            message: 'Image Deleted Successfully!!!',
            variant: 'success',
          }),
        );
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error!!',
            message: error.message,
            variant: 'error',
          }),
        );
      });
  }

  // ... (any other methods or lifecycle hooks)
}
