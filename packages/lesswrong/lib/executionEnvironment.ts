import { Meteor } from 'meteor/meteor';

export const isServer = Meteor.isServer
export const isClient = Meteor.isClient
export const isDevelopment = Meteor.isDevelopment
export const isProduction = Meteor.isProduction
export const isAnyTest = Meteor.isTest || Meteor.isAppTest || Meteor.isPackageTest
export const isPackageTest = Meteor.isPackageTest

export const onStartup = (fn: ()=>void) => {
  Meteor.startup(fn);
}

export const getInstanceSettings = () => Meteor.settings;

export const getAbsoluteUrl = (maybeRelativeUrl?: string): string => {
  return Meteor.absoluteUrl(maybeRelativeUrl);
}
