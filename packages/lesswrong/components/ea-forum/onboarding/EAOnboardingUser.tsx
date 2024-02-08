import React, { useEffect } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { formatRole, formatStat } from "../../users/EAUserTooltipContent";
import { useNotifyMe } from "../../hooks/useNotifyMe";
import { useOptimisticToggle } from "../../hooks/useOptimisticToggle";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    userSelect: "none",
    border: `1px solid ${theme.palette.grey["A100"]}`,
    borderRadius: theme.borderRadius.default,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    flexBasis: "34%",
    flexGrow: 1,
    "&:hover": {
      backgroundColor: theme.palette.grey[250],
    },
    [theme.breakpoints.down("xs")]: {
      flexBasis: "51%",
    },
  },
  selected: {
    border: `1px solid ${theme.palette.primary.dark}`,
  },
  header: {
    display: "flex",
    gap: "14px",
  },
  name: {
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 700,
  },
  karma: {
    color: theme.palette.grey[650],
    fontSize: 13,
    fontWeight: 500,
  },
  role: {
    color: theme.palette.grey[1000],
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "130%",
    paddingTop: 8,
  },
});

export const EAOnboardingUser = ({user, onSubscribed, classes}: {
  user: UserOnboarding,
  onSubscribed?: (id: string, subscribed: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {isSubscribed, onSubscribe} = useNotifyMe({
    document: user,
    overrideSubscriptionType: "newPosts",
    hideFlashes: true,
  });
  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    onSubscribe ?? (() => {}),
  );

  const {_id, displayName, karma, jobTitle, organization} = user;

  useEffect(() => {
    onSubscribed?.(_id, subscribed);
  }, [_id, subscribed, onSubscribed]);

  const {UsersProfileImage} = Components;
  return (
    <div
      onClick={toggleSubscribed}
      className={classNames(classes.root, {
        [classes.selected]: subscribed,
      })}
    >
      <div className={classes.header}>
        <UsersProfileImage user={user} size={40} />
        <div>
          <div className={classes.name}>
            {displayName}
          </div>
          <div className={classes.karma}>
            {formatStat(karma)} karma
          </div>
        </div>
      </div>
      <div>
        {formatRole(jobTitle, organization)}
      </div>
    </div>
  );
}

const EAOnboardingUserComponent = registerComponent(
  "EAOnboardingUser",
  EAOnboardingUser,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingUser: typeof EAOnboardingUserComponent
  }
}
