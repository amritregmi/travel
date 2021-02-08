class APIFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }
    filter() {
        // 1A) Filtering
        let queryObj = {
            ...this.queryString
        }
        const excludeField = ['page', 'sort', 'limit', 'fields']
        excludeField.forEach(field => delete queryObj[field])

        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj)

        // replace gt, gte, lt, lte with $gt, $gte, ...
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        this.query = this.query.find(JSON.parse(queryStr))
        return this
    }
    sort() {
        // 2) sorting
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }
        return this
    }
    limitFields() {
        // 3) Field Limiting
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v')
        }
        return this
    }
    paginate() {
        // 4) Pagination
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 100
        const skip = (page - 1) * limit
        this.query = this.query.skip(skip).limit(limit)
        return this
    }
}
module.exports = APIFeatures