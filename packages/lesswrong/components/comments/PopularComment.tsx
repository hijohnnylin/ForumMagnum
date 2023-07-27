import React, { FC, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { ExpandedDate } from "../common/FormatDate";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { commentGetPageUrl } from "../../lib/collections/comments/helpers";
import { Comments } from "../../lib/collections/comments";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: "8px 12px",
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  postWrapper: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  post: {
    color: theme.palette.grey[1000],
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  postRead: {
    color: theme.palette.grey[600],
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    whiteSpace: "nowrap",
    "&:hover": {
      opacity: 1,
      color: theme.palette.primary.light,
    },
  },
  username: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    color: theme.palette.grey[1000],
  },
  date: {
    color: theme.palette.grey[600],
  },
  vote: {
    display: "flex",
    alignItems: "center",
  },
  body: {
    lineHeight: "160%",
    letterSpacing: "-0.14px",
    color: theme.palette.grey[1000],
  },
  bodyCollapsed: {
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    // Maybe we revisit this in the future - Figma designs had a "Read more"
    // but this is spectacularly difficult
    // "&::before": {
      // content: '"(Show more)"',
      // float: "right",
      // marginTop: "1.5em",
      // color: theme.palette.primary.main,
      // fontWeight: 600,
      // "&:hover": {
        // color: theme.palette.primary.light,
      // },
    // },
  },
});

const PopularCommentTitle: FC<{
  comment: CommentsListWithParentMetadata,
  post: NonNullable<Pick<CommentsListWithParentMetadata, "post">["post"]>,
  classes: ClassesType,
}> = ({comment, post, classes}) => {
  const {isRead} = useRecordPostView(post);
  return (
    <div className={classes.row}>
      <InteractionWrapper className={classes.postWrapper}>
        <Link
          to={postGetPageUrl(post)}
          className={classNames(classes.post, {[classes.postRead]: isRead})}
        >
          {post.title}
        </Link>
      </InteractionWrapper>
      <InteractionWrapper>
        <Link to={commentGetPageUrl(comment)} className={classes.link}>
          View in thread
        </Link>
      </InteractionWrapper>
    </div>
  );
}

const PopularComment = ({comment, classes}: {
  comment: CommentsListWithParentMetadata,
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false);

  const onClickCallback = useCallback(() => {
    setExpanded(!expanded);
    captureEvent("popularCommentToggleExpanded", {expanded: !expanded});
  }, [expanded, captureEvent]);

  const {onClick} = useClickableCell({onClick: onClickCallback});

  const {UsersName, LWTooltip, SmallSideVote, CommentBody} = Components;
  return (
    <div onClick={onClick} className={classes.root}>
      {comment.post &&
        <PopularCommentTitle
          post={comment.post}
          comment={comment}
          classes={classes}
        />
      }
      <div className={classes.row}>
        <InteractionWrapper>
          <UsersName user={comment.user} className={classes.username} />
        </InteractionWrapper>
        <div className={classes.date}>
          <LWTooltip
            placement="right"
            title={<ExpandedDate date={comment.postedAt} />}
          >
            {moment(new Date(comment.postedAt)).fromNow()}
          </LWTooltip>
        </div>
        {!comment.debateResponse && !comment.rejected &&
          <InteractionWrapper className={classes.vote}>
            <SmallSideVote
              document={comment}
              collection={Comments}
              hideKarma={comment.post?.hideCommentKarma}
            />
          </InteractionWrapper>
        }
      </div>
      {expanded
        ? (
          <CommentBody comment={comment} className={classes.body} />
        )
        : (
          <div className={classNames(classes.body, classes.bodyCollapsed)}>
            {htmlToTextDefault(comment.contents?.html)}
          </div>
        )
      }
    </div>
  );
}

const PopularCommentComponent = registerComponent(
  "PopularComment",
  PopularComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    PopularComment: typeof PopularCommentComponent
  }
}