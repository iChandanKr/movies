class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObj = { ...this.queryStr }; //creating a shallow copy

    const excludeFields = ["sort", "page", "limit", "fields"];

    excludeFields.forEach((el) => {
      delete queryObj[el];
      // console.log(el);
    });
    let queryString = JSON.stringify(queryObj);
    // console.log(queryStr);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    const finalQuery = JSON.parse(queryString);
    this.query = this.query.find(finalQuery);
    return this;
  }

  sort() {
    let sort = null;
    if (this.queryStr.sort) {
      sort = this.queryStr.sort.replace(/(,)/g, " ");
    } else {
      sort = "-createdAt";
    }
    this.query = this.query.sort(sort);
    return this;
  }

  limitFields() {
    let fields = null;
    if (this.queryStr.fields) {
      fields = this.queryStr.fields.replace(/(,)/g, " ");
    } else {
      fields = "-__v";
    }
    this.query = this.query.select(fields);
    return this;
  }

  paginate() {
    //     let moviesCount = null;
    //   if (req.query.page) {
    //     moviesCount = await Movie.countDocuments();
    //   }

    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
