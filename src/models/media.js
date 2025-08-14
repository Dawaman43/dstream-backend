import mongoose from "mongoose";

const episodeSchema = new mongoose.Schema(
  {
    season: {
      type: Number,
      required: true,
      min: 0,
    },
    episode: {
      type: Number,
      required: true,
      min: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      trim: true,
    },
    still: {
      type: String,
      validate: {
        validator: (v) => v === null || /^https?:\/\//.test(v),
        message: "Still must be a valid URL or null",
      },
    },
    air_date: {
      type: Date,
    },
    runtime: {
      type: Number,
      min: 0,
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 10,
      },
      count: {
        type: Number,
        min: 0,
      },
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const torrentSchema = new mongoose.Schema(
  {
    magnet: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => v.startsWith("magnet:?"),
        message: "Magnet must be a valid magnet link",
      },
    },
    quality: {
      type: String,
      required: true,
      enum: ["480p", "720p", "1080p", "2160p", "4K", "8K"],
    },
    size: {
      type: String,
      match: [/^\d+(\.\d+)?\s?(MB|GB)$/, "Size must be in MB or GB"],
    },
    seeds: {
      type: Number,
      min: 0,
    },
    peers: {
      type: Number,
      min: 0,
    },
    provider: {
      type: String,
      enum: ["YTS", "RARBG", "1337x", "ThePirateBay", "Torrentz2", "Other"],
    },
    resolution: {
      type: String,
      enum: ["SD", "HD", "FHD", "UHD", "4K", "8K"],
    },
    codec: {
      type: String,
      enum: ["H.264", "H.265", "AV1", "VP9", "Other"],
    },
    language: {
      type: String,
      default: "English",
    },
    isRepack: {
      type: Boolean,
      default: false,
    },
    videoQuality: {
      type: String,
      enum: ["Low", "Medium", "High", "Ultra"],
    },
    audioQuality: {
      type: String,
      enum: ["Mono", "Stereo", "5.1", "7.1", "Atmos"],
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: {
      type: Number,
      required: true,
      min: 0,
    },
    episodeCount: {
      type: Number,
      min: 0,
    },
    airDate: {
      type: Date,
    },
    poster: {
      type: String,
      validate: {
        validator: (v) => v === null || /^https?:\/\//.test(v),
        message: "Poster must be a valid URL or null",
      },
    },
    overview: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const ratingSchema = new mongoose.Schema(
  {
    average: {
      type: Number,
      min: 0,
      max: 10,
    },
    count: {
      type: Number,
      min: 0,
    },
    popularity: {
      type: Number,
      min: 0,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const mediaSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    imdbId: {
      type: String,
      match: [/^tt\d{7,8}$/, "Please provide a valid IMDb ID"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      text: true,
      maxlength: 500,
    },
    originalTitle: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["movie", "tv", "anime"],
      required: true,
      index: true,
    },
    overview: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    poster: {
      type: String,
      validate: {
        validator: (v) => v === null || /^https?:\/\//.test(v),
        message: "Poster must be a valid URL or null",
      },
    },
    backdrop: {
      type: String,
      validate: {
        validator: (v) => v === null || /^https?:\/\//.test(v),
        message: "Backdrop must be a valid URL or null",
      },
    },
    genres: [
      {
        id: {
          type: Number,
          min: 0,
        },
        name: {
          type: String,
          trim: true,
        },
      },
    ],
    runtime: {
      type: Number,
      min: 0,
    },
    rating: ratingSchema,
    releaseDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "Rumored",
        "Planned",
        "In Production",
        "Post Production",
        "Released",
        "Canceled",
      ],
    },
    seasons: [seasonSchema],
    episodes: [episodeSchema],
    torrents: [torrentSchema],
    providers: [
      {
        type: String,
        enum: ["Netflix", "Hulu", "Amazon", "Disney+", "HBO Max", "Other"],
      },
    ],
    languages: [
      {
        type: String,
        enum: ["English", "Spanish", "French", "German", "Japanese", "Other"],
      },
    ],
    country: {
      type: String,
      maxlength: 2,
      uppercase: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days TTL
      index: { expires: "30d" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for formatted release year
mediaSchema.virtual("year").get(function () {
  return this.releaseDate?.getFullYear();
});

// Indexes
mediaSchema.index({ title: "text", type: 1 });
mediaSchema.index({ tmdbId: 1, type: 1 });
mediaSchema.index({ "torrents.quality": 1, "torrents.provider": 1 });
mediaSchema.index({ lastUpdated: 1 });

// Static methods
mediaSchema.statics.findByTmdbId = async function (tmdbId, type) {
  const id = Number(tmdbId);
  if (!Number.isInteger(id)) return null;

  return this.findOne({ tmdbId: id, type });
};

mediaSchema.statics.searchByTitle = function (query, type, limit = 20) {
  return this.find(
    {
      $text: { $search: query },
      ...(type && { type }),
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit);
};

mediaSchema.statics.getByGenre = function (genreId, type, limit = 20) {
  return this.find({
    "genres.id": Number(genreId),
    type,
  }).limit(limit);
};

// Pre-save hook to update timestamps
mediaSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Query helper for filtering by quality
mediaSchema.query.byQuality = function (quality) {
  return this.where("torrents.quality").equals(quality);
};

const Media = mongoose.model("Media", mediaSchema);

export default Media;
