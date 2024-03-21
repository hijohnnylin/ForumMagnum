import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { cellTextStyles } from "./PeopleDirectoryTextCell";
import { InteractionWrapper } from "../common/useClickableCell";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  name: {
    ...cellTextStyles(theme),
    flexGrow: 1,
  },
  message: {
    display: "none", // See `PeopleDirectoryUserCell` for logic to show this
    color: theme.palette.grey[600],
    "&:hover": {
      color: theme.palette.grey[800],
    },
  },
});

export const PeopleDirectoryUserCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {UsersProfileImage, NewConversationButton, ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <UsersProfileImage user={user} size={32} />
      <div className={classes.name}>{user.displayName}</div>
      <InteractionWrapper href="#">
        <NewConversationButton currentUser={currentUser} user={user}>
          <ForumIcon icon="Envelope" className={classes.message} />
        </NewConversationButton>
      </InteractionWrapper>
    </div>
  );
}

const PeopleDirectoryUserCellComponent = registerComponent(
  "PeopleDirectoryUserCell",
  PeopleDirectoryUserCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryUserCell: typeof PeopleDirectoryUserCellComponent
  }
}
