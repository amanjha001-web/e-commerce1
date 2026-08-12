
/*                              Pick Fields                                   */

const pick = (object = {}, allowedFields = []) => {
  return Object.keys(object).reduce((result, key) => {
    if (allowedFields.includes(key)) {
      result[key] = object[key];
    }

    return result;
  }, {});
};

/*                                  Export                                    */

export default pick;
