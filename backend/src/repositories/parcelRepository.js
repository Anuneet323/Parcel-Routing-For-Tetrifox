const Parcel = require('../models/parcel');

class ParcelRepository {
  /**
   * Save a new parcel record.
   * @param {Object} parcelData 
   * @returns {Promise<Object>} The saved Parcel document.
   */
  async create(parcelData) {
    const parcel = new Parcel(parcelData);
    await parcel.save();
    return parcel;
  }

  /**
   * Count all processed parcels.
   * @returns {Promise<number>}
   */
  async countAll() {
    return await Parcel.countDocuments();
  }

  /**
   * Count parcels matching a specific status.
   * @param {string} status 
   * @returns {Promise<number>}
   */
  async countByStatus(status) {
    return await Parcel.countDocuments({ status });
  }

  /**
   * Count parcels assigned to a specific department.
   * @param {string} department 
   * @returns {Promise<number>}
   */
  async countByDepartment(department) {
    return await Parcel.countDocuments({ department });
  }

  /**
   * Find parcels matching a filter, sorted by creation date (newest first).
   * @param {Object} filter 
   * @returns {Promise<Array>}
   */
  async findAll(filter = {}) {
    return await Parcel.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Delete all parcel records.
   * @returns {Promise<Object>}
   */
  async clearAll() {
    return await Parcel.deleteMany({});
  }
}

module.exports = new ParcelRepository();
