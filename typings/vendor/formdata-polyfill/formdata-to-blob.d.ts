/**
 * pure function to convert any formData instance to a Blob
 * instances synchronous without reading all of the files
 *
 * @param {FormData|*} formData an instance of a formData Class
 * @param {Blob|*} [BlobClass=Blob] the Blob class to use when constructing it
 */
export function formDataToBlob(formData: FormData | any, BlobClass?: Blob | any): any;
