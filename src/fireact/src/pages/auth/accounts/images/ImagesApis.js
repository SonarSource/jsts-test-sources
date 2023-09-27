import imagesJson from "./images.json";

const images = imagesJson.images;

const ListImageApiStatic = (page, pageSize) => {
    return new Promise((resolve, reject) => {
        const start = page * pageSize;
        if(start >= 0 && start < images.length-1){
            let records = [];
            for(let i=start; i<images.length; i++){
                if(images.length<=i || i>=(start+pageSize)){
                    break;
                }
                const record = {
                    id: i,
                    url: images[i].url,
                    title: images[i].title
                }
                records.push(record);
            }
            setTimeout(() =>
                resolve({
                    total: images.length,
                    data: records
                }), 2000);
        }else{
            reject('out of range');
        }
    });
}

const GetImageApiStatic = (id) => {
    return new Promise((resolve, reject) => {
        if(id >= 0 && id<images.length){
            setTimeout(() =>
                resolve(images[id]), 1000);
        }else{
            reject('out of range');
        }
    })
}

const CreateImageApiStatic = (data) => {
    return new Promise((resolve, reject) => {
        if(data.title.indexOf('error') === -1){
            setTimeout(() => resolve("success"), 1000);
        }else{
            reject("This is an error demo");
        }
    })
}

const EditImageApiStatic = (id, data) => {
    return new Promise((resolve, reject) => {
        if(id >= 0 && id<images.length){
            if(data.title.indexOf('error') === -1){
                setTimeout(() => resolve("success"), 1000);
            }else{
                reject("This is an error demo");
            }
        }else{
            reject('out of range');
        }
        
    })
}

const DeleteImageApiStatic = (id) => {
    return new Promise((resolve, reject) => {
        if(id >= 0 && id<images.length){
            setTimeout(() => resolve("success"), 1000);
        }else{
            reject('out of range');
        }
    })
}

export {
    ListImageApiStatic,
    CreateImageApiStatic,
    GetImageApiStatic,
    EditImageApiStatic,
    DeleteImageApiStatic
}