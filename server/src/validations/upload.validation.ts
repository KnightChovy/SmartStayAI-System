import Joi from 'joi';

export const uploadFile = {
  query: Joi.object().keys({
    // Gom file vào đúng nhóm trên Cloudinary; bỏ trống sẽ rơi vào thư mục "misc"
    folder: Joi.string().valid('licenses', 'representatives', 'properties', 'documents'),
  }),
};
