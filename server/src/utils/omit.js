
/*                              Omit Fields                                   */

const omit = (object = {}, omittedFields = []) => {
  return Object.keys(object).reduce((result, key) => {
    if (!omittedFields.includes(key)) {
      result[key] = object[key];
    }

    return result;
  }, {});
};

/*                                  Export                                    */

export default omit;
