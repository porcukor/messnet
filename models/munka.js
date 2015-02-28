/* 
** Munka Schema
*/
var dateFormat = require('dateformat');
function init(Schema, mongoose) {

var LogschemaOptions = {
  toObject: { virtuals: true }, toJSON: { virtuals: true }
};

	var LogSchema = new Schema({
	tipus: String,
	event: String,
	desc: String,
	creator: String
	}, LogschemaOptions );

	LogSchema.virtual('creationDate').get(function () {
		return dateFormat(this._id.getTimestamp(), 'isoDateTime');
	});

	var MunkaSchema = new Schema({
    cim: {
		honnan: {
			varos: String,
			zip: Number,
			utca: String,
			info: String,
			location: {
						lat: String,
						lng: String
					}
		},
			
		hova: {
			varos: String,
			zip: Number,
			utca: String,
			info: String,
			location: {
						lat: String,
						lng: String
					}
		}
    },
    tipus: {
		eszkoz: { type: Number, default: 1 },
		extrak: {
			tulmeret: Boolean,
			surgos: Boolean,
			esti: Boolean
		}
    },
	log: [LogSchema],
    megrendelo: String,
    atvevo: String,
	dij: Number,
	futar: String,
	tav: String,
	status: { type: Number, default: 0 }
});
	var MM = mongoose.model('munka', MunkaSchema, 'munka');
	return MM;
}
module.exports.init = init;
