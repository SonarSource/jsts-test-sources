import React from 'react';

let { array, string, number, object, bool, shape, oneOfType, arrayOf } = React.PropTypes;

var _listingSource = shape({
  url: string.isRequired,
});

var _listingResolutions = arrayOf(shape({
  width: number.isRequired,
  height: number.isRequired,
  url: string.isRequired,
}));

var _listingVariants = shape({
  nsfw: shape({
    resolutions: _listingResolutions.isRequired,
    source: _listingSource,
  })
});

export default {

  comment: shape({
    author: string.isRequired,
    author_flair_text: string,
    author_flair_css_class: string,
    body: string.isRequired,
    body_html: string.isRequired,
    created_utc: number.isRequired,
    distinguished: bool,
    gilded: number.isRequired,
    hidden: bool,
    id: string.isRequired,
    likes: oneOfType([
      bool,
      number,
    ]),
    link_title: string,
    link_url: string,
    name: string.isRequired,
    replies: oneOfType([
      array,
      string,
    ]).isRequired,
    saved: bool.isRequired,
    score: number.isRequired,
  }),

  listing: shape({
    _type: string.isRequired,
    author: string.isRequired,
    cleanPermalink: string.isRequired,
    created_utc: number.isRequired,
    distinguished: string,
    domain: string.isRequired,
    edited: oneOfType([
      bool,
      number,
    ]).isRequired,
    expandContent: string,
    gilded: number.isRequired,
    hidden: bool.isRequired,
    id: string.isRequired,
    is_self: bool.isRequired,
    likes: oneOfType([
      bool,
      number,
    ]),
    link_flair_css_class: string,
    link_flair_text: string,
    media: shape({
      oembed: shape({
        height: number.isRequired,
        html: string.isRequired,
        thumbnail_url: string.isRequired,
        type: string.isRequired,
        width: number.isRequired,
      }),
    }),
    name: string.isRequired,
    num_comments: number.isRequired,
    preview: shape({
      images: arrayOf(shape({
        source: _listingSource,
        variants: _listingVariants,
      })).isRequired,
      variants: _listingVariants,
      resolutions: _listingResolutions,
      source: _listingSource,
    }),
    over_18: bool.isRequired,
    promoted: bool,
    saved: bool.isRequired,
    selftext: string.isRequired,
    sr_detail: shape({
      icon_img: string,
      key_color: string,
    }),
    subreddit: string,
    thumbnail: string,
    title: string.isRequired,
    token: string,
    url: string.isRequired,
  }),

  subscriptions: arrayOf(shape({
    display_name: string.isRequired,
    icon: string,
    url: string.isRequired,
  })),

  user: shape({
    created: number.isRequired,
    is_mod: bool.isRequired,
    inbox_count: number,
    link_karma: number.isRequired,
    name: string.isRequired,
  }),
};
