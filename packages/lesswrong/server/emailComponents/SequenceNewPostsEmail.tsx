import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { makeCloudinaryImageUrl } from '../../components/common/CloudinaryImage2';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
    marginBottom: 40
  },
  img: {
    display: 'block',
    maxHeight: 250,
    margin: '0 auto 25px',
  },
});

const SequenceNewPostsEmail = ({sequence, posts, classes}: {
  sequence: DbSequence,
  posts: DbPost[],
  classes: any,
}) => {
  const img = sequence.gridImageId || sequence.bannerImageId;
    const imgUrl = img ? makeCloudinaryImageUrl(img, {
      c: "fill",
      dpr: "auto",
      q: "auto",
      f: "auto",
      g: "auto:faces",
    }) : undefined;
  
  return <div className={classes.root}>
    {imgUrl && <img src={imgUrl} className={classes.img} />}
    <p>
      The following posts have been added to <a href={sequenceGetPageUrl(sequence, true)}>{sequence.title}</a>:
    </p>
    <ul>
      {posts.map(post => {
        return <li key={post._id}>
          <a href={postGetPageUrl(post, true)}>{post.title}</a>
        </li>
      })}
    </ul>
  </div>
}

const SequenceNewPostsEmailComponent = registerComponent("SequenceNewPostsEmail", SequenceNewPostsEmail, {styles});

declare global {
  interface ComponentTypes {
    SequenceNewPostsEmail: typeof SequenceNewPostsEmailComponent
  }
}
